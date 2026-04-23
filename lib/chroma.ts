import { ChromaClient, IncludeEnum } from "chromadb";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const EMBEDDING_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export interface ChromaResult {
  id: string;
  content: string;
  metadata: any;
  distance: number;
  score: number; // normalized 0–1, higher = more relevant
}

// ─── Chroma Health Check ─────────────────────────────────────────────────────

export async function isChromaOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${CHROMA_URL}/api/v1/heartbeat`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Embedding via Ollama (with fallback) ────────────────────────────────────

async function getOllamaEmbedding(text: string): Promise<number[]> {
  const urls = [
    "http://127.0.0.1:11434/api/embeddings",
    "http://localhost:11434/api/embeddings",
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.embedding) && data.embedding.length > 0) {
          return data.embedding;
        }
      }
    } catch {
      // try next URL
    }
  }

  console.warn("[Chroma] Ollama embedding unavailable — returning empty vector");
  return [];
}

const ollamaEmbeddingFunction = {
  generate: async (texts: string[]): Promise<number[][]> =>
    Promise.all(texts.map((t) => getOllamaEmbedding(t))),
};

// ─── ChromaDB Client (singleton with reconnect guard) ────────────────────────
//
// FIX: The original singleton was never cleared, so a Chroma restart would
// leave a stale client that throws on every call. Now we probe liveness before
// reusing the cached instance and reset it when Chroma is unreachable.

let client: ChromaClient | null = null;
let clientHealthy = false;

export async function getChromaClient(): Promise<ChromaClient> {
  // If we have a client but haven't verified it's still alive, re-probe
  if (client && !clientHealthy) {
    const alive = await isChromaOnline();
    if (!alive) {
      // Reset so the next call creates a fresh instance after Chroma recovers
      client = null;
      throw new Error("[Chroma] Server is offline — client reset for next attempt");
    }
    clientHealthy = true;
  }

  if (!client) {
    const alive = await isChromaOnline();
    if (!alive) {
      throw new Error("[Chroma] Server is offline");
    }
    client = new ChromaClient({ path: CHROMA_URL });
    clientHealthy = true;
  }

  return client;
}

// Allow callers to invalidate the client (e.g. after a caught network error)
export function invalidateChromaClient(): void {
  client = null;
  clientHealthy = false;
}

export async function getOrCreateCollection(name: string) {
  const chroma = await getChromaClient();
  return chroma.getOrCreateCollection({
    name,
    embeddingFunction: ollamaEmbeddingFunction as any,
    metadata: { "hnsw:space": "cosine" },
  });
}

// ─── Convert cosine distance → relevance score (0–1) ─────────────────────────

function distanceToScore(distance: number): number {
  return Math.max(0, 1 - distance / 2);
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchChroma(
  collectionName: string,
  query: string,
  limit: number = 3,
  minScore: number = 0.3,
): Promise<ChromaResult[]> {
  if (!(await isChromaOnline())) return [];

  const testEmbedding = await getOllamaEmbedding(query);
  if (testEmbedding.length === 0) {
    console.warn("[Chroma] Skipping search — embedding model unavailable");
    return [];
  }

  try {
    const collection = await getOrCreateCollection(collectionName);
    const count = await collection.count();
    if (count === 0) return [];

    const results = await collection.query({
      queryTexts: [query],
      nResults: Math.min(limit, count),
      include: [
        IncludeEnum.documents,
        IncludeEnum.metadatas,
        IncludeEnum.distances,
      ],
    });

    if (!results?.ids?.[0]?.length) return [];

    return results.ids[0]
      .map((id, i) => {
        const distance = (results.distances?.[0]?.[i] as number) ?? 1;
        const score = distanceToScore(distance);
        return {
          id,
          content: (results.documents?.[0]?.[i] as string) || "",
          metadata: results.metadatas?.[0]?.[i] || {},
          distance,
          score,
        };
      })
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score);
  } catch (err) {
    console.error(`[Chroma] Search error in "${collectionName}":`, err);
    // Invalidate client so next call rebuilds it (handles post-restart scenarios)
    invalidateChromaClient();
    return [];
  }
}

// ─── Upsert ──────────────────────────────────────────────────────────────────

export async function upsertToChroma(
  collectionName: string,
  items: { id: string; content: string; metadata?: any }[],
): Promise<void> {
  if (items.length === 0) return;
  if (!(await isChromaOnline())) {
    console.warn("[Chroma] Skipping upsert — server offline");
    return;
  }

  try {
    const collection = await getOrCreateCollection(collectionName);
    await collection.upsert({
      ids: items.map((i) => i.id),
      documents: items.map((i) => i.content),
      metadatas: items.map((i) => i.metadata || {}),
    });
    console.log(`[Chroma] Upserted ${items.length} items to "${collectionName}"`);
  } catch (err) {
    console.error(`[Chroma] Upsert error in "${collectionName}":`, err);
    invalidateChromaClient();
  }
}

// ─── Delete collection ───────────────────────────────────────────────────────

export async function deleteCollection(name: string): Promise<void> {
  try {
    const chroma = await getChromaClient();
    await chroma.deleteCollection({ name });
    console.log(`[Chroma] Deleted collection "${name}"`);
  } catch (err) {
    console.warn(`[Chroma] Could not delete collection "${name}":`, err);
  }
}