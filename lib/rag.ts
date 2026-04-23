/**
 * RAG Engine for FORS IT Support Chatbot
 *
 * Knowledge sources (in priority order):
 *  1. validated_incidents + ai_analysis  — past confirmed resolutions
 *  2. predefined_queries                 — known solution patterns
 *  3. database_tables + database_fields  — schema catalog for self-resolution
 *  4. transactions + menus               — FORS navigation context
 *  5. incidents                          — live ticket data
 *  6. chromadb                           — semantic vector search (both collections)
 *
 * FIX: Background sync race condition — isSynced was set to true BEFORE the
 * async work completed, so a failed first boot silently disabled ChromaDB
 * forever. Now we only set isSynced=true after successful completion, and
 * log a warning on failure so operators know why semantic search is empty.
 */

import pool from "@/lib/db";
import { searchChroma, isChromaOnline } from "@/lib/chroma";
import { syncIncidentsToChroma, syncQueriesToChroma } from "@/lib/sync-chroma";

const USE_CHROMADB = true;

// ─── Sync state ──────────────────────────────────────────────────────────────
// FIX: Track sync status properly so a failed sync can be retried.
// - "pending"  → not yet attempted
// - "synced"   → completed successfully, do not re-run
// - "failed"   → last attempt failed, allow one retry on next request
type SyncState = "pending" | "synced" | "failed";
let syncState: SyncState = "pending";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RagChunk {
  source: string;
  relevanceScore: number;
  content: string;
}

export interface RagContext {
  chunks: RagChunk[];
  text: string;
}

// ─── Keyword Extraction ──────────────────────────────────────────────────────

function extractKeywords(message: string): string[] {
  const stopwords = new Set([
    "the", "and", "for", "are", "with", "that", "this", "from", "have",
    "can", "not", "was", "what", "how", "when", "where", "which",
    "est", "les", "des", "une", "dans", "pour", "qui", "que", "sur", "par",
  ]);
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopwords.has(w));
  return Array.from(new Set(words));
}

function scoreRelevance(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k)).length / keywords.length;
}

// ─── Source 1: Validated Incidents ──────────────────────────────────────────

async function searchValidatedIncidents(
  keywords: string[],
  _message: string,
): Promise<RagChunk[]> {
  if (keywords.length === 0) return [];

  try {
    const conditions = keywords
      .map(
        () =>
          `(a.incident_description LIKE ? OR i.short_description LIKE ? OR i.description LIKE ? OR a.root_cause LIKE ?)`,
      )
      .join(" OR ");
    const params = keywords.flatMap((k) => [
      `%${k}%`,
      `%${k}%`,
      `%${k}%`,
      `%${k}%`,
    ]);

    const [rows] = (await pool.execute(
      `
      SELECT
        a.incident_number,
        a.incident_description,
        a.final_solution,
        a.root_cause,
        a.resolution_steps,
        a.confidence_score,
        i.short_description,
        i.priority
      FROM ai_analysis a
      LEFT JOIN tickets i ON i.number = a.incident_number
      WHERE a.final_solution IS NOT NULL AND (${conditions})
      ORDER BY a.confidence_score DESC
      LIMIT 5
    `,
      params,
    )) as any;

    return (rows as any[]).map((row) => {
      const relevance = scoreRelevance(
        `${row.incident_description} ${row.short_description} ${row.root_cause}`,
        keywords,
      );
      const content = [
        `[Past Resolution ${row.incident_number}]`,
        `Problem: ${(row.incident_description || row.short_description || "").substring(0, 80)}`,
        `Cause: ${(row.root_cause || "Unknown").substring(0, 80)}`,
        `Solution: ${(row.final_solution || "See details").replace(/\s+/g, " ").substring(0, 180)}`,
      ].join(" | ");

      return { source: "validated_incidents", relevanceScore: relevance, content };
    });
  } catch (err) {
    console.error("[RAG] validated_incidents error:", err);
    return [];
  }
}

// ─── Source 2: Predefined Queries ───────────────────────────────────────────

async function searchPredefinedQueries(
  keywords: string[],
  _message: string,
): Promise<RagChunk[]> {
  if (keywords.length === 0) return [];

  try {
    const conditions = keywords
      .map(() => `(name LIKE ? OR description LIKE ? OR category LIKE ?)`)
      .join(" OR ");
    const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`, `%${k}%`]);

    const [rows] = (await pool.execute(
      `
      SELECT name, description, category, \`sql\` as query_sql
      FROM predefined_queries
      WHERE isActive = 1 AND (${conditions})
      LIMIT 5
    `,
      params,
    )) as any;

    return (rows as any[]).map((row) => {
      const relevance = scoreRelevance(
        `${row.name} ${row.description} ${row.category}`,
        keywords,
      );
      const sql = (row.query_sql || "").replace(/\s+/g, " ").substring(0, 120);
      const content = `[Predefined Query] ${row.name}: ${row.description} | SQL: ${sql}`;
      return {
        source: "predefined_queries",
        relevanceScore: relevance + 0.1,
        content,
      };
    });
  } catch (err) {
    console.error("[RAG] predefined_queries error:", err);
    return [];
  }
}

// ─── Source 3: DB Schema Catalog ────────────────────────────────────────────

async function searchSchemaCatalog(
  keywords: string[],
  _message: string,
): Promise<RagChunk[]> {
  if (keywords.length === 0) return [];

  try {
    const conditions = keywords
      .map(() => `(t.name LIKE ? OR t.description LIKE ?)`)
      .join(" OR ");
    const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`]);

    const [tableRows] = (await pool.execute(
      `
      SELECT t.id, t.name, t.description,
             GROUP_CONCAT(DISTINCT CONCAT(f.name, ' (', IFNULL(f.type,''), ')') ORDER BY f.position SEPARATOR ', ') as fields,
             GROUP_CONCAT(DISTINCT idx.name SEPARATOR ', ') as indexes
      FROM database_tables t
      LEFT JOIN database_fields f ON f.tableId = t.id
      LEFT JOIN database_indexes idx ON idx.tableId = t.id
      WHERE (${conditions})
      GROUP BY t.id, t.name, t.description
      LIMIT 5
    `,
      params,
    )) as any;

    return (tableRows as any[]).map((row) => {
      const relevance = scoreRelevance(
        `${row.name} ${row.description}`,
        keywords,
      );
      const fields = (row.fields || "").substring(0, 180);
      const content = `[Dataset Table: ${row.name}] ${row.description || ""} | Fields: ${fields} | Indexes: ${row.indexes || "None"}`;
      return {
        source: "database_schema",
        relevanceScore: relevance + 0.15,
        content,
      };
    });
  } catch (err) {
    console.error("[RAG] schema catalog error:", err);
    return [];
  }
}

// ─── Source 4: Transactions & Menus ─────────────────────────────────────────

async function searchTransactionsMenus(
  keywords: string[],
  message: string,
): Promise<RagChunk[]> {
  const navKeywords = [
    "transaction", "menu", "navigate", "accès", "access", "where", "comment",
  ];
  const isNavQuestion =
    navKeywords.some((w) => message.toLowerCase().includes(w)) ||
    /\b[A-Z]{2,6}\d?\b/.test(message);

  if (!isNavQuestion || keywords.length === 0) return [];

  try {
    const chunks: RagChunk[] = [];
    const conditions = keywords
      .map(() => `(name LIKE ? OR description LIKE ?)`)
      .join(" OR ");
    const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`]);

    const [trRows] = (await pool.execute(
      `
      SELECT name, description, pgmType, sqlPg, tables
      FROM transactions
      WHERE ${conditions}
      LIMIT 5
    `,
      params,
    )) as any;

    for (const row of trRows as any[]) {
      const relevance = scoreRelevance(
        `${row.name} ${row.description}`,
        keywords,
      );
      const content = `[Transaction ${row.name}] ${row.description}${row.tables ? " | Tables: " + row.tables : ""}`;
      chunks.push({ source: "transactions", relevanceScore: relevance, content });
    }

    const menuConditions = keywords
      .map(() => `(title LIKE ? OR description LIKE ?)`)
      .join(" OR ");
    const menuParams = keywords.flatMap((k) => [`%${k}%`, `%${k}%`]);

    const [mnRows] = (await pool.execute(
      `
      SELECT title, description, path
      FROM menus
      WHERE ${menuConditions}
      LIMIT 5
    `,
      menuParams,
    )) as any;

    for (const row of mnRows as any[]) {
      const relevance = scoreRelevance(
        `${row.title} ${row.description}`,
        keywords,
      );
      const content = `[Menu ${row.title}] ${row.description}`;
      chunks.push({ source: "menus", relevanceScore: relevance, content });
    }

    return chunks;
  } catch (err) {
    console.error("[RAG] transactions/menus error:", err);
    return [];
  }
}

// ─── Source 5: Live Incident Context ────────────────────────────────────────

async function searchLiveIncidents(
  keywords: string[],
  message: string,
): Promise<RagChunk[]> {
  const incMatch = message.match(/INC\d+/i);

  if (incMatch) {
    try {
      const [rows] = (await pool.execute(
        `
        SELECT i.number, i.short_description, i.description, i.state, i.priority,
               i.comments, i.work_notes,
               a.final_solution as validated_solution,
               a.root_cause as ai_root_cause, a.resolution_steps
        FROM tickets i
        LEFT JOIN ai_analysis a ON a.incident_number = i.number
        WHERE i.number = ?
        LIMIT 1
      `,
        [incMatch[0].toUpperCase()],
      )) as any;

      if ((rows as any[]).length > 0) {
        const r = (rows as any[])[0];
        const content = [
          `[Incident ${r.number}] State: ${r.state} | Priority: ${r.priority}`,
          `Desc: ${(r.short_description || r.description || "").substring(0, 150)}`,
          `Comments/Notes: ${(r.comments || r.work_notes || "None").substring(0, 150)}`,
          `AI Analysis: ${r.ai_root_cause || "None"}`,
          `Resolution: ${r.validated_solution || "Pending"}`,
        ].join(" | ");
        return [{ source: "incidents", relevanceScore: 1.0, content }];
      }
    } catch (err) {
      console.error("[RAG] incident lookup error:", err);
    }
  }

  if (keywords.length > 0) {
    try {
      const conditions = keywords
        .map(
          () =>
            `(short_description LIKE ? OR description LIKE ? OR comments LIKE ?)`,
        )
        .join(" OR ");
      const params = keywords.flatMap((k) => [`%${k}%`, `%${k}%`, `%${k}%`]);

      const [rows] = (await pool.execute(
        `
        SELECT number, short_description, comments, state
        FROM tickets
        WHERE ${conditions}
        ORDER BY opened_at DESC
        LIMIT 3
      `,
        params,
      )) as any;

      return (rows as any[]).map((row) => ({
        source: "ticket_history",
        relevanceScore: scoreRelevance(
          `${row.short_description} ${row.comments}`,
          keywords,
        ),
        content: `[Historical Ticket ${row.number}] ${row.short_description} | State: ${row.state} | Comments: ${(row.comments || "").substring(0, 100)}`,
      }));
    } catch (err) {
      console.error("[RAG] ticket_history error:", err);
    }
  }

  return [];
}

// ─── Source 6: ChromaDB Semantic Search ─────────────────────────────────────

async function searchSemanticKnowledge(message: string): Promise<RagChunk[]> {
  if (!USE_CHROMADB) return [];

  const online = await isChromaOnline();
  if (!online) return [];

  // FIX: Only skip if sync succeeded previously. On "pending" or "failed",
  // attempt the sync. Set syncState=true only after both tasks resolve.
  if (syncState !== "synced") {
    // Fire-and-forget but capture outcome to update syncState correctly
    Promise.all([syncIncidentsToChroma(), syncQueriesToChroma()])
      .then(() => {
        syncState = "synced";
        console.log("[RAG] ChromaDB background sync completed successfully");
      })
      .catch((e) => {
        syncState = "failed"; // will be retried on next request
        console.warn("[RAG] ChromaDB background sync failed — will retry:", e.message);
      });
  }

  try {
    const [incidentResults, queryResults] = await Promise.all([
      searchChroma("validated_incidents", message, 3, 0.35),
      searchChroma("predefined_queries", message, 2, 0.35),
    ]);

    const incidentChunks: RagChunk[] = incidentResults.map((res) => ({
      source: "chromadb_incidents",
      relevanceScore: res.score * 0.9,
      content: `[Semantic Incident] ${res.content}`,
    }));

    const queryChunks: RagChunk[] = queryResults.map((res) => ({
      source: "chromadb_queries",
      relevanceScore: res.score * 0.9,
      content: `[Semantic Query] ${res.content}`,
    }));

    return [...incidentChunks, ...queryChunks];
  } catch (err) {
    console.error("[RAG] ChromaDB search error:", err);
    return [];
  }
}

// ─── Main RAG Retriever ──────────────────────────────────────────────────────

export async function retrieveRagContext(message: string): Promise<RagContext> {
  const keywords = extractKeywords(message);

  const [
    validatedChunks,
    predefinedChunks,
    schemaChunks,
    navChunks,
    incidentChunks,
    semanticChunks,
  ] = await Promise.all([
    searchValidatedIncidents(keywords, message),
    searchPredefinedQueries(keywords, message),
    searchSchemaCatalog(keywords, message),
    searchTransactionsMenus(keywords, message),
    searchLiveIncidents(keywords, message),
    searchSemanticKnowledge(message),
  ]);

  // Deduplicate semantic results that overlap with SQL results
  const sqlIncidentIds = new Set(
    validatedChunks
      .map((c) => c.content.match(/\[Past Resolution (\w+)\]/)?.[1])
      .filter(Boolean),
  );

  const filteredSemantic = semanticChunks.filter((c) => {
    const id = c.content.match(/INC\d+/i)?.[0];
    return !id || !sqlIncidentIds.has(id);
  });

  const allChunks = [
    ...validatedChunks,
    ...predefinedChunks,
    ...schemaChunks,
    ...navChunks,
    ...incidentChunks,
    ...filteredSemantic,
  ]
    .filter((c) => c.relevanceScore > 0 || c.source === "incidents")
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);

  const text =
    allChunks.length > 0
      ? allChunks.map((c) => c.content).join("\n\n")
      : "No specific knowledge found for this query. Answering from general FORS knowledge.";

  return { chunks: allChunks, text };
}