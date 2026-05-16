import { query, execute } from "./db";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

export type AuditAction =
  | "SQL_EXECUTED"
  | "RAW_SQL_EXECUTED"
  | "RAW_SQL_FAILED"
  | "AI_ANALYSIS_GENERATED"
  | "TICKET_VALIDATED"
  | "TICKET_REJECTED"
  | "TICKET_SAP_MODULE_UPDATED"
  | "CHAT_MESSAGE_SENT"
  | "CONVERSATION_DELETED"
  | "USER_CREATED"
  | "PERMISSIONS_UPDATED"
  | "INTEGRATION_UPDATED"
  | "KPI_UPDATED"
  | "XML_TICKET_IMPORTED"
  | "VIEW_PERMISSIONS_UPDATED"
  | "REPORT_GENERATED"
  | "TICKET_STATUS_UPDATED"
  | "TICKET_COMMENT_ADDED"
  | "INCOMING_N8N_TICKET"
  | "LOGIN"
  | "LOGOUT";

interface LogOptions {
  ticketId?: string;
  details?: any;
  userMatricule?: string;
}

/**
 * Centrally manages all audit logging for the FORS platform.
 * Logs are stored in the audit_logs table with JSON details.
 */
export async function logActivity(action: AuditAction, options: LogOptions = {}) {
  try {
    let { ticketId, details = {}, userMatricule } = options;

    // 1. Resolve user if not provided
    if (!userMatricule) {
      try {
        const session = await getSession();
        userMatricule = session.user?.matricule || "SYSTEM";
      } catch (e) {
        userMatricule = "SYSTEM";
      }
    }

    // 2. Standardize details JSON
    const logDetails = {
      ...details,
      ticketId: ticketId || details.ticketId,
      timestamp: new Date().toISOString(),
    };

    // 3. Deduplication Check
    // Prevent duplicate entries for the exact same action and ticket context
    try {
      const lastLogs = await query<any>(
        "SELECT details FROM audit_logs WHERE action = ? AND user_matricule = ? ORDER BY created_at DESC LIMIT 1",
        [action, userMatricule]
      );

      if (lastLogs.length > 0) {
        const lastDetails = JSON.parse(lastLogs[0].details || '{}');

        // Ensure same ticket context
        if (logDetails.ticketId === lastDetails.ticketId) {
          // Compare object signatures excluding timestamps
          const { timestamp: _currTime, ...currSig } = logDetails;
          const { timestamp: _lastTime, ...lastSig } = lastDetails;

          if (JSON.stringify(currSig) === JSON.stringify(lastSig)) {
            console.log(`[Audit] Suppressed duplicate log for ${action} — payload identical.`);
            return { success: true, deduplicated: true }; // Skip insert
          }
        }
      }
    } catch (dedupErr) {
      console.error("[Audit] Deduplication check failed, proceeding to log normally:", dedupErr);
    }

    // 4. Persist to DB
    await execute(
      "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
      [userMatricule, action, JSON.stringify(logDetails)]
    );

    // 4. Revalidate activity page
    revalidatePath("/activity");

    console.log(`[Audit] ${action} logged for ${userMatricule}`);
    return { success: true };
  } catch (err) {
    console.error("[Audit] Failed to log activity:", err);
    return { success: false, error: err };
  }
}
