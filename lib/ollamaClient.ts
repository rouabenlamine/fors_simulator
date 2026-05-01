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
 * SQL Sanitizer — enforces well-formed MariaDB syntax regardless of model output.
 *
 * Rules applied (in order):
 *  1. Strip any lingering markdown SQL fences (```sql ... ```)
 *  2. Trim surrounding whitespace
 *  3. If the result is empty or a comment-only string, return the comment unchanged
 *  4. Ensure the statement starts with a valid CRUD verb (SELECT / INSERT / UPDATE / DELETE)
 *     — if the model prefixed the query with prose, we extract from the first verb
 *  5. Collapse runs of whitespace to single spaces for readability
 *  6. Guarantee the statement ends with exactly one semicolon
 */
function sanitizeSql(raw: string): string {
    if (!raw) return '-- No SQL generated';

    // 1. Strip markdown SQL fences
    let sql = raw
        .replace(/^```(?:sql)?\s*/im, '')
        .replace(/\s*```$/m, '')
        .trim();

    // 2. If it's purely a comment (model correctly returned none), leave it alone
    if (/^--/.test(sql)) return sql;

    // 3. Find the first occurrence of a CRUD keyword and slice from there
    const crudMatch = sql.match(/\b(SELECT|INSERT|UPDATE|DELETE)\b/i);
    if (!crudMatch || crudMatch.index === undefined) {
        // Model returned something that isn't SQL at all
        return '-- No valid SQL statement detected in model output';
    }
    sql = sql.slice(crudMatch.index);

    // 4. Collapse excessive whitespace
    sql = sql.replace(/\s+/g, ' ').trim();

    // 5. Ensure exactly one trailing semicolon
    sql = sql.replace(/;*$/, '') + ';';

    return sql;
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
- issue_type: concise root cause category (string)
- priority: exactly one of: critical, high, medium, low
- summary: detailed root cause analysis (string)
- possible_causes: array of strings listing possible root causes
- recommended_actions: array of strings listing precise step-by-step solutions
- impacted_tables: array of table names taken STRICTLY from the <Schema> below. NEVER invent table names.
- suggested_sql: ONE single MariaDB-compatible SQL query following ALL rules below:
    RULE 1 — Start with exactly one of: SELECT, INSERT, UPDATE, DELETE (no other prefix allowed).
    RULE 2 — End with a semicolon (;).
    RULE 3 — Use ONLY table names and column names that exist in the <Schema>. Never guess.
    RULE 4 — No markdown formatting, no backtick fences, no prose before or after the SQL.
    RULE 5 — If <Schema> says "No physical business tables found", return the string: -- No business tables exist in the database to query.
    EXAMPLE of correct output: SELECT id, name FROM orders WHERE status = 'pending';

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

        // FIX 3: Sanitize the suggested SQL so it always starts with a CRUD verb and ends with ;
        if (parsed.suggested_sql) {
            parsed.suggested_sql = sanitizeSql(parsed.suggested_sql);
        }

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