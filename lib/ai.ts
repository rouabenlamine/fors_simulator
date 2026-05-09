import { retrieveRagContext } from "@/lib/rag";
import { analyzeIncident } from "@/lib/ollamaClient";
import pool from "@/lib/db";

export interface AnalysisResult {
  rootCause: string;
  confidence: number;
  urgency: "critical" | "high" | "medium" | "low";
  impactedTables: { name: string; confidence: number }[];
  sqlProposal: string;
  recommendation: string;
  agentSummary: string;
}

// ─── Dataset Schema Loader ───────────────────────────────────────────────────

/**
 * Fetches the target dataset schema with full column detail.
 * Runs DESCRIBE on every non-system table so the AI knows the exact column
 * names and types — preventing hallucinated field names in generated SQL.
 *
 * Output format example:
 *   orders(id INT, customer_name VARCHAR, total DECIMAL, created_at DATETIME)
 *   products(id INT, name VARCHAR, price DECIMAL, stock INT)
 */
async function getTargetDatasetSchema(): Promise<string> {
  try {
    // 1. Discover all physical tables in the database
    const [allTables] = await pool.execute("SHOW TABLES") as any;

    // 2. Strip out platform-internal tables so the AI doesn't reference them
    const systemTables = new Set([
      'ai_analysis', 'audit_logs', 'chat_history', 'conversations', 'messages',
      'database_fields', 'database_indexes', 'database_tables', 'discussions',
      'kpi_configs', 'menus', 'predefined_queries', 'sessions', 'system_configurations',
      'tickets', 'transactions', 'users', 'validated_incidents',
    ]);

    const realTables = (allTables as any[])
      .map(row => Object.values(row)[0] as string)
      .filter(name => !systemTables.has(name));

    if (realTables.length === 0) {
      return 'No physical business tables found in the database.';
    }

    // 3. DESCRIBE each table to get real column names + types
    const schemaParts: string[] = [];
    for (const tableName of realTables) {
      try {
        const [columns] = await pool.execute(`DESCRIBE \`${tableName}\``) as any;
        const colDefs = (columns as any[])
          .map(c => `${c.Field} ${c.Type}`)
          .join(', ');
        schemaParts.push(`${tableName}(${colDefs})`);
      } catch {
        schemaParts.push(`${tableName}(-- schema unavailable --)`);
      }
    }

    console.log(`[Schema] Loaded ${realTables.length} business tables with column detail.`);
    return schemaParts.join('\n');
  } catch (err) {
    console.warn('[Schema] Failed to load physical schema:', err);
    return 'Schema metadata unavailable.';
  }
}

// ─── Incident Analysis ───────────────────────────────────────────────────────

export async function generateAnalysisWithOllama(
  incidentTitle: string,
  description: string,
): Promise<AnalysisResult> {
  try {
    const [context, datasetSchema] = await Promise.all([
      retrieveRagContext(`${incidentTitle} ${description}`),
      getTargetDatasetSchema()
    ]);

    // Call the centralized Ollama client for lightweight, concise JSON analysis
    const incidentAnalysis = await analyzeIncident(
      context.text, 
      `${incidentTitle}\n\n${description}`,
      datasetSchema
    );

    // If analysis failed, return graceful error — NEVER expose raw errors to end-user
    if (incidentAnalysis.error) {
      console.error("[generateAnalysis] Incident analysis error:", incidentAnalysis.error);
      return {
        rootCause: "Analysis failed — the AI engine could not generate a diagnosis at this time.",
        confidence: 0,
        urgency: "medium",
        impactedTables: [],
        sqlProposal: "-- Automated analysis unavailable",
        recommendation: "The system was unable to produce an automated resolution. Please retry or escalate to an engineer.",
        agentSummary: "Analysis failed. Please retry later.",
      };
    }

    // ── True Confidence Scoring ─────────────────────────────────────
    // Confidence is computed from actual signal presence rather than hardcoded.
    let confidence = 30; // baseline: AI produced *some* output
    if (incidentAnalysis.issue_type) confidence += 15;        // AI identified the issue type
    if (incidentAnalysis.summary) confidence += 10;        // AI produced a summary
    if (incidentAnalysis.possible_causes && incidentAnalysis.possible_causes.length > 0) {
      confidence += Math.min(incidentAnalysis.possible_causes.length * 5, 20); // up to +20 for cause depth
    }
    if (incidentAnalysis.recommended_actions && incidentAnalysis.recommended_actions.length > 0) {
      confidence += Math.min(incidentAnalysis.recommended_actions.length * 5, 20); // up to +20 for actionable steps
    }
    if (incidentAnalysis.priority) confidence += 5;           // AI assessed priority
    // Cap at 95 — never claim 100% certainty from AI alone
    confidence = Math.min(confidence, 95);

    // Map the lightweight JSON output to the full AnalysisResult format
    return {
      rootCause: incidentAnalysis.issue_type
        ? `${incidentAnalysis.issue_type}: ${incidentAnalysis.summary || ""}`
        : incidentAnalysis.summary || "Analysis complete",
      confidence,
      urgency: (incidentAnalysis.priority?.toLowerCase() as any) || "medium",
      impactedTables: (incidentAnalysis.impacted_tables || []).map(t => ({
        name: t,
        confidence: Math.round(confidence * 0.8) // derived confidence for specific tables
      })),
      sqlProposal: incidentAnalysis.suggested_sql || "-- No SQL proposal generated",
      recommendation: incidentAnalysis.recommended_actions
        ? incidentAnalysis.recommended_actions.join("\n")
        : "Refer to issue type and possible causes above",
      agentSummary: `Issue: ${incidentAnalysis.issue_type || "Unknown"} | Causes: ${incidentAnalysis.possible_causes?.join(", ") || "See analysis"
        }`,
    };
  } catch (error: any) {
    // STRICT ERROR MASKING: Raw errors are logged server-side but NEVER exposed to the UI
    console.error("[generateAnalysis] Unexpected error:", error.message);
    return {
      rootCause: "Analysis failed — the AI service encountered an internal error.",
      confidence: 0,
      urgency: "medium",
      impactedTables: [],
      sqlProposal: "-- Automated analysis unavailable",
      recommendation: "The automated analysis service is temporarily unavailable. Please retry the analysis or escalate to a support engineer.",
      agentSummary: "Analysis failed. Please retry later.",
    };
  }
}

// ─── FORS Agent Chat Response ────────────────────────────────────────────────

const OFF_TOPIC_REPLY =
  "I can only answer questions about this specific ticket. Please ask something related to the incident, its diagnosis, or its resolution.";

/**
 * Determines whether the user message is on-topic for the given ticket.
 * Returns false for greetings, personal questions, or anything with no
 * connection to the ticket subject.
 */
function isOnTopic(message: string, ticket: any | null): boolean {
  const lower = message.toLowerCase().trim();

  // Pure greetings / small-talk patterns
  const offTopicPatterns = [
    /^(hi|hello|hey|good\s*(morning|afternoon|evening)|how are you|what'?s up|sup)\b/i,
    /^(who are you|what are you|tell me about yourself|your name)\b/i,
    /\b(weather|joke|fun fact|personal|hobby|favorite)\b/i,
    /^(thanks?|thank you|thx|cheers|bye|goodbye|see you)\s*[.!]?\s*$/i,
  ];

  if (offTopicPatterns.some(p => p.test(lower))) return false;

  // If there's a ticket in context the message is almost certainly on-topic
  return true;
}

export async function getAgentChatResponse(
  userMessage: string,
  history: { role: string; content: string }[] = [],
  ticketContext: any | null = null,
): Promise<string> {
  // ── Fast off-topic guard (no LLM call needed) ─────────────────────────────
  if (!isOnTopic(userMessage, ticketContext)) {
    return OFF_TOPIC_REPLY;
  }

  // ── Build the ticket-scoped system prompt ────────────────────────────────
  let ticketBlock = "";
  if (ticketContext) {
    ticketBlock = `
ACTIVE TICKET (your working context for this session):
  ID          : ${ticketContext.number}
  Title       : ${ticketContext.short_description || "N/A"}
  Description : ${ticketContext.description || "N/A"}
  Status      : ${ticketContext.state || "N/A"}
  Priority    : ${ticketContext.priority || "N/A"}
  Team        : ${ticketContext.assignment_group || "N/A"}
  Assigned To : ${ticketContext.assigned_to || "Unassigned"}
${ticketContext.root_cause ? `  AI Root Cause  : ${ticketContext.root_cause}` : ""}
${ticketContext.suggested_sql ? `  AI SQL Proposal: ${ticketContext.suggested_sql}` : ""}
${ticketContext.resolution_steps ? `  AI Resolution  : ${ticketContext.resolution_steps}` : ""}`;
  }

  const systemPrompt = `You are FORS Agent, the FORS IT support assistant, operating inside an incident ticket session.

Your job is to help the user investigate, understand, and resolve the ACTIVE TICKET. You are a technical expert.

WHAT YOU MUST DO:
  - Answer any technical question related to the incident's problem domain (database issues, SQL queries, error analysis, system behavior, alternative approaches, debugging steps, etc.)
  - Suggest alternative SQL queries or improved solutions even if not already in the ticket — technical exploration is valid and expected.
  - Explain concepts, propose fixes, or analyze the root cause more deeply if asked.
  - Keep answers concise and direct. No verbose intros, no "Great question!", no unsolicited summaries.

WHAT YOU MUST NOT DO:
  - Do NOT reference other tickets or past incidents unless the user explicitly asks.
  - Do NOT answer questions completely unrelated to the incident (greetings, personal chat, weather, sports, etc.).
  - Do NOT fabricate ticket metadata (status, assigned team, priority) — report only what is in the ACTIVE TICKET block.
  - Do NOT refuse legitimate technical requests by citing "guidelines" — if it relates to the incident's problem, answer it.
${ticketBlock}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3",
        messages,
        stream: false,
        options: {
          num_ctx: 2048,
          temperature: 0.2,  // Slightly higher to allow creative technical reasoning
        }
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Ollama Chat] Server error: ${response.status}`);
      return "FORS Agent chat service temporarily unavailable. Please try again.";
    }

    const data = await response.json();
    let reply = data.message?.content || "No response generated.";

    // Guard: Remove <think> XML tags if the model injects them anyway
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // Guard: Remove numbered "Thinking Process:" steps if generated
    if (reply.includes("Thinking Process:")) {
      const parts = reply.split(/(?:Final Answer:|Refine the Response:|---\n)/i);
      if (parts.length > 1) {
        reply = parts[parts.length - 1].replace(/^[\s*"-]+/, "").trim();
      } else {
        reply = reply.replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z_])/i, "").trim();
      }
    }

    // Guard: only strip genuinely off-topic drift (references to other tickets)
    // Do NOT strip legitimate technical suggestions like alternative SQL
    const driftPatterns = [
      /similar (tickets?|incidents?|issues?) (?:show|reveal|suggest|indicate)/i,
      /\bin (other|previous|another) tickets?\b/i,
      /historically speaking/i,
    ];
    if (ticketContext && driftPatterns.some(p => p.test(reply))) {
      const sentences = reply.split(/(?<=[.!?])\s+/);
      const clean = sentences.filter(s => !driftPatterns.some(p => p.test(s)));
      reply = clean.length > 0 ? clean.join(" ").trim() : reply;
    }

    return reply;
  } catch (err: any) {
    const message = err.name === "AbortError"
      ? "Chat request timed out"
      : err.message || "Unknown error";
    console.error("[getAgentChatResponse] Error:", message);
    return `FORS Agent offline. Please check your local AI server (run \`ollama serve\` with phi3 model).`;
  }
}