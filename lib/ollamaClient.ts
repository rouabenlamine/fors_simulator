/**
 * Centralized Ollama Client
 *
 * Prevents resource exhaustion on 8GB RAM systems by:
 * - Using a single hardcoded lightweight model (phi3)
 * - Enforcing strict JSON output format
 * - Setting aggressive timeouts and context limits
 * - Properly handling errors with safe fallbacks
 *
 * FIX 1: Strip markdown JSON fences before parsing (phi3 sometimes ignores format:"json")
 * FIX 2: Validate/normalize the priority field before returning
 */

export interface IncidentAnalysis {
    issue_type?: string;
    priority?: string;
    summary?: string;
    possible_causes?: string[];
    recommended_actions?: string[];
    impacted_tables?: string[];
    suggested_sql?: string;
    error?: string;
}

const OLLAMA_HOST = "http://127.0.0.1:11434";
const MODEL = "phi3";
const TIMEOUT_MS = 300000; // 5 minutes for slower local machines
const CONTEXT_SIZE = 2048;  // Reduced for 8GB RAM
const TEMPERATURE = 0.1;    // Very low for consistent JSON output

const VALID_PRIORITIES = new Set(["critical", "high", "medium", "low"]);

/**
 * FIX 1: Strips markdown code fences that phi3 sometimes emits despite format:"json".
 * e.g. ```json { ... } ``` → { ... }
 */
function stripJsonFences(raw: string): string {
    return raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
}

/**
 * FIX 2: Normalize priority to one of the four valid urgency levels.
 * phi3 may return "Priority: high", "HIGH", "High Priority", etc.
 */
function normalizePriority(raw?: string): "critical" | "high" | "medium" | "low" {
    if (!raw) return "medium";
    const lower = raw.toLowerCase();
    for (const level of ["critical", "high", "medium", "low"] as const) {
        if (lower.includes(level)) return level;
    }
    return "medium";
}

/**
 * Analyzes an incident ticket using the local Ollama phi3 model.
 * Returns a concise JSON structure optimized for 8GB RAM constraints.
 */
export async function analyzeIncident(
    retrievedNotes: string,
    newTicket: string,
    datasetSchema: string = "",
): Promise<IncidentAnalysis> {
const prompt = `You are an expert IT Support AI. Analyze this support ticket accurately based on the <Context> and <Schema>.
Return ONLY valid JSON. No thinking, no markdown, no intro, no outro.

JSON Keys:
- issue_type: concise root cause category
- priority: critical, high, medium, or low (one word only)
- summary: detailed root cause analysis
- possible_causes: list of possible root causes
- recommended_actions: list of precise step-by-step solutions
- impacted_tables: list of table names STRICTLY from the schema below. NEVER hallucinate table names or guess them from the ticket.
- suggested_sql: ONE single valid SQL query. Ensure correct syntax and column names based EXACTLY on the <Schema>. Use proper JOINs if needed. Do not include markdown code block formatting.
- IMPORTANT: If the <Schema> section says "No physical business tables found in the database.", DO NOT generate a technical SQL query. Instead, return: "-- No business tables exist in the database to query."

<Schema>
${datasetSchema}
</Schema>

<Context>
${retrievedNotes}
</Context>

Ticket: ${newTicket}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: MODEL,
                prompt,
                stream: false,
                format: "json",
                options: {
                    temperature: TEMPERATURE,
                    num_ctx: CONTEXT_SIZE,
                },
            }),
            signal: controller.signal,
            cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[Ollama] Server error: ${response.status}`);
            return { error: `Ollama server returned ${response.status}` };
        }

        const data = await response.json();

        if (!data.response) {
            console.error("[Ollama] Empty response from model");
            return { error: "Model returned empty response" };
        }

        // FIX 1: Strip fences before parsing — phi3 ignores format:"json" sometimes
        const cleaned = stripJsonFences(data.response);

        let parsed: IncidentAnalysis;
        try {
            parsed = JSON.parse(cleaned) as IncidentAnalysis;
        } catch {
            console.error("[Ollama] JSON parse failed. Raw response:", data.response.substring(0, 200));
            return { error: "Model returned invalid JSON" };
        }

        // FIX 2: Normalize priority so urgency mapping in ai.ts never silently passes garbage
        parsed.priority = normalizePriority(parsed.priority);

        return parsed;
    } catch (error: any) {
        const message =
            error.name === "AbortError"
                ? "Analysis timeout - local server took too long to respond"
                : error.message || "Unknown error";

        console.error(`[analyzeIncident] Error: ${message}`);
        return {
            error: `Analysis failed or timed out. Details: ${message}`,
        };
    }
}