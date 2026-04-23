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
  gostSummary: string;
}

// ─── Dataset Schema Loader ───────────────────────────────────────────────────

/**
 * Fetches the target dataset schema from the `database_tables` metadata table.
 * This ensures the AI reasons about the actual data model being analyzed
 * and NOT the IT Support platform's internal system tables.
 */
async function getTargetDatasetSchema(): Promise<string> {
  try {
    // We MUST use SHOW TABLES to ensure the AI only gets tables that physically exist
    // in the database, avoiding SQL execution errors for missing tables.
    const [allTables] = await pool.execute("SHOW TABLES") as any;
    
    // Filter out the platform's internal system tables
    const systemTables = ['ai_analysis', 'audit_logs', 'chat_history', 'database_fields', 'database_indexes', 'database_tables', 'discussions', 'kpi_configs', 'menus', 'predefined_queries', 'sessions', 'tickets', 'transactions', 'users', 'validated_incidents'];
    
    const realTables = (allTables as any[])
      .map(row => Object.values(row)[0] as string)
      .filter(name => !systemTables.includes(name));

    if (realTables.length > 0) {
      console.log(`[Schema] Discovered ${realTables.length} physical business tables.`);
      return realTables.join(', ');
    }

    return 'No physical business tables found in the database.';
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
        gostSummary: "Analysis failed. Please retry later.",
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
      gostSummary: `Issue: ${incidentAnalysis.issue_type || "Unknown"} | Causes: ${incidentAnalysis.possible_causes?.join(", ") || "See analysis"
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
      gostSummary: "Analysis failed. Please retry later.",
    };
  }
}

// ─── GOST Chat Response ──────────────────────────────────────────────────────

export async function getGostChatResponse(
  userMessage: string,
  history: { role: string; content: string }[] = [],
): Promise<string> {
  const [context, datasetSchema] = await Promise.all([
    retrieveRagContext(userMessage),
    getTargetDatasetSchema(),
  ]);

  const systemPrompt = `You are GOST, the FORS automated support assistant.
Answer accurately and fast. No internal thinking. No intro/outro.
Be concise and precise to the message sent by the user. Do not respond with blocks of words. Provide exactly the desired response.
Use the TARGET DATASET SCHEMA for table references.

TARGET DATASET SCHEMA:
${datasetSchema}

KNOWLEDGE CONTEXT:
${context.text}`;

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
          temperature: 0.3
        }
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Ollama Chat] Server error: ${response.status}`);
      return "GOST chat service temporarily unavailable. Please try again.";
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

    return reply;
  } catch (err: any) {
    const message = err.name === "AbortError"
      ? "Chat request timed out"
      : err.message || "Unknown error";
    console.error("[getGostChatResponse] Error:", message);
    return `GOST offline. Please check your local AI server (run \`ollama serve\` with phi3 model).`;
  }
}