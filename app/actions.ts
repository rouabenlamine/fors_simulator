"use server";

import { query, execute, transaction, generateId } from "@/lib/db";
import { Ticket, TicketAnalysis, ChatMessage, KPI, ActivityLog, User } from "@/lib/types";
import { generateAnalysisWithOllama, getGostChatResponse } from "@/lib/ai";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";


export async function getTickets(): Promise<Ticket[]> {
  const q = `
    SELECT 
      t.number as id, 
      t.short_description as title, 
      t.description as description, 
      t.state as state,
      t.priority as priority,
      t.sys_class_name as sysClassName,
      t.assignment_group as team,
      t.assigned_to as assignedTo,
      t.sys_created_on as createdAt,
      t.sys_updated_on as updatedAt,
      t.opened_by as openedBy,
      t.opened_at as openedAt,
      t.closed_at as closedAt,
      t.closed_by as closedBy,
      t.business_service as businessService,
      t.close_notes as closeNotes,
      t.comments as comments,
      a.confidence_score * 100 as confidence
    FROM tickets t
    LEFT JOIN ai_analysis a ON t.number = a.incident_number
  `;
  const results = await query<any>(q);
  const data = results.map(r => ({
    ...r,
    status: (r.state?.toLowerCase() === 'closed' ? 'closed' :
      r.state?.toLowerCase() === 'canceled' ? 'canceled' :
        r.state?.toLowerCase() === 'validated' ? 'validated' :
          r.state?.toLowerCase() === 'rejected' ? 'rejected' :
            r.state?.toLowerCase() === 'analysis pending' ? 'analysis_pending' :
              r.state?.toLowerCase() === 'sql proposed' ? 'sql_proposed' :
                'pending'),
    aiConfidence: r.confidence,
  }));
  return JSON.parse(JSON.stringify(data));
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const q = `
    SELECT 
      number as id, 
      short_description as title, 
      description, 
      state, 
      priority, 
      sys_class_name as sysClassName,
      assignment_group as team, 
      assigned_to as assignedTo, 
      sys_created_on as createdAt, 
      sys_updated_on as updatedAt, 
      opened_by as openedBy,
      opened_at as openedAt,
      closed_at as closedAt,
      closed_by as closedBy,
      t.business_service as businessService,
      t.close_notes as closeNotes,
      t.comments as comments,
      a.confidence_score * 100 as confidence
    FROM tickets t
    LEFT JOIN ai_analysis a ON t.number = a.incident_number
    WHERE t.number = ?
  `;
  const tickets = await query<any>(q, [id]);
  if (tickets.length === 0) return null;
  const r = tickets[0];
  const data = {
    ...r,
    status: (r.state?.toLowerCase() === 'closed' ? 'closed' :
      r.state?.toLowerCase() === 'canceled' ? 'canceled' :
        r.state?.toLowerCase() === 'validated' ? 'validated' :
          r.state?.toLowerCase() === 'rejected' ? 'rejected' :
            r.state?.toLowerCase() === 'analysis pending' ? 'analysis_pending' :
              r.state?.toLowerCase() === 'sql proposed' ? 'sql_proposed' :
                'pending'),
    aiConfidence: r.confidence,
  };
  return JSON.parse(JSON.stringify(data));
}

export async function getAnalyses(): Promise<TicketAnalysis[]> {
  const rows = await query<any>("SELECT * FROM ai_analysis");
  const data = rows.map((r: any) => {
    let parsedTables = [];
    try {
      if (r.impacted_tables) parsedTables = JSON.parse(r.impacted_tables);
    } catch (e) {}
    
    return {
      ticketId: r.incident_number,
      rootCause: r.root_cause || "Unknown",
      impactedTables: parsedTables,
      recommendation: r.resolution_steps || "",
      sqlProposal: r.suggested_sql || "",
      gostSummary: "",
      urgency: "high"
    };
  });
  return JSON.parse(JSON.stringify(data));
}

export async function getConversations() {
  const rows = await query<any>("SELECT * FROM conversations ORDER BY created_at DESC");
  return JSON.parse(JSON.stringify(rows));
}

/**
 * Returns all conversations enriched with message count and last message preview.
 * Used by the Chat History sidebar to render conversation cards.
 */
export async function getConversationsWithMeta() {
  const rows = await query<any>(`
    SELECT
      c.conversation_id AS conversationId,
      c.ticket_number   AS ticketId,
      c.user_matricule  AS userMatricule,
      c.title,
      c.created_at      AS createdAt,
      COUNT(m.id)        AS messageCount,
      (
        SELECT m2.content FROM messages m2
        WHERE m2.conversation_id = c.conversation_id
        ORDER BY m2.created_at DESC LIMIT 1
      ) AS lastMessageContent,
      (
        SELECT m2.role FROM messages m2
        WHERE m2.conversation_id = c.conversation_id
        ORDER BY m2.created_at DESC LIMIT 1
      ) AS lastMessageRole,
      (
        SELECT m2.created_at FROM messages m2
        WHERE m2.conversation_id = c.conversation_id
        ORDER BY m2.created_at DESC LIMIT 1
      ) AS lastMessageAt
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.conversation_id
    GROUP BY c.conversation_id
    ORDER BY COALESCE((
      SELECT MAX(m3.created_at) FROM messages m3 WHERE m3.conversation_id = c.conversation_id
    ), c.created_at) DESC
  `);
  return JSON.parse(JSON.stringify(rows));
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const qStr = `
    SELECT m.id, m.conversation_id as conversationId, m.role, m.content, m.created_at as createdAt, c.ticket_number as ticketId, m.user_matricule as senderName
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.conversation_id
  `;
  const rows = await query<any>(qStr);
  const data = rows.map((r: any) => ({
    id: r.id.toString(),
    conversationId: r.conversationId,
    ticketId: r.ticketId, // keep for UI backwards compatibility if needed
    role: r.role,
    content: r.content,
    createdAt: r.createdAt,
    senderName: r.role === 'AI' ? 'GOST AI' : r.senderName
  }));
  return JSON.parse(JSON.stringify(data));
}

export async function getKpis(): Promise<KPI[]> {
  // This is generic mock for now if kpis logic isn't heavily present in DB stats
  return [
    { id: "k1", category: "sla", label: "SLA Compliance Rate", value: 87, change: 3, changeType: "up", unit: "%", target: 95 },
    { id: "k2", category: "sla", label: "SLA Breaches", value: 4, change: -2, changeType: "down" },
    { id: "k7", category: "volume", label: "Open Tickets", value: 7 }
  ];
}

export async function getActivities(): Promise<ActivityLog[]> {
  try {
    const session = await getSession();
    const role = session.user?.role;

    if (role && role !== "admin" && role !== "superadmin") {
      const { getViewPermissionsForRole } = await import("@/app/actions/view-permissions-actions");
      const permissions = await getViewPermissionsForRole(role);
      if (permissions.activity_logs === false) {
        throw new Error("403 Forbidden");
      }
    }

    const rows = await query<any>("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50");
    console.log("[getActivities] Fetched rows count:", rows.length);

    if (rows && rows.length > 0) {
      console.log("[getActivities] First row sample:", Object.keys(rows[0]));
    }

    const data = rows.map((r: any) => {
      let tId = "";
      let detailsMsg = "";
      try {
        const parsed = JSON.parse(r.details || "{}");
        tId = parsed.ticketId || "";

        if (!tId && typeof parsed.message === 'string') {
          const match = parsed.message.match(/(INC\d+)/);
          if (match) tId = match[1];
        }
      } catch (e) {
        console.error("[getActivities] details parse error for row id", r.id, e);
      }

      return {
        id: (r.id || r.ID || Math.random()).toString(),
        action: r.action || "UNKNOWN",
        ticketId: tId,
        performedBy: r.user_matricule || "System",
        timestamp: r.created_at || new Date().toISOString(),
        details: r.details || ""
      };
    });
    return JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.error("[getActivities] Server error:", err);
    return [];
  }
}

export async function getUsers(): Promise<User[]> {
  const rows = await query<any>("SELECT * FROM users");
  return rows.map((r: any) => ({
    matricule: r.matricule,
    name: r.name,
    surname: r.prenom,
    role: r.role === "admin" ? "manager" : r.role === "it_support" ? "agent" : "reporter"
  }));
}

export async function getMenus() {
  const rows = await query<any>("SELECT * FROM menus");
  return JSON.parse(JSON.stringify(rows));
}

export async function getTransactions() {
  const rows = await query<any>("SELECT * FROM transactions");
  return JSON.parse(JSON.stringify(rows));
}

export async function getTableNames(): Promise<string[]> {
  const rows = await query<any>("SHOW TABLES");
  const dbName = process.env.DB_NAME || 'fors_simulator';
  return rows.map((r: any) => Object.values(r)[0] as string);
}

export async function getTableSchema(tableName: string) {
  const rows = await query<any>(`DESCRIBE ??`, [tableName]);
  return JSON.parse(JSON.stringify(rows));
}

export async function getTableData(tableName: string) {
  const rows = await query<any>(`SELECT * FROM ?? LIMIT 500`, [tableName]);
  return JSON.parse(JSON.stringify(rows));
}

export async function createTicket(ticket: Partial<Ticket>) {
  const q = `
    INSERT INTO tickets (
      number, 
      short_description, 
      description, 
      state, 
      priority, 
      assignment_group, 
      assigned_to, 
      sys_created_on, 
      sys_updated_on, 
      opened_by, 
      opened_at, 
      sys_class_name
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      short_description = VALUES(short_description),
      description = VALUES(description),
      state = VALUES(state),
      sys_updated_on = VALUES(sys_updated_on)
  `;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const values = [
    ticket.id,
    ticket.title,
    ticket.description,
    'pending',
    ticket.priority || 'P3',
    ticket.team || 'IT Support',
    ticket.assignedTo || null,
    now,
    now,
    'Manual Entry',
    now,
    'incident'
  ];
  await query(q, values);

  // Log ticket creation
  const session = await getSession();
  await logActivity("AI_ANALYSIS_GENERATED", {
    ticketId: ticket.id,
    details: { message: `Created ticket ${ticket.id}` }
  });

  return { success: true };
}

export async function analyzeTicketAction(ticketId: string, title: string, description: string) {
  // 0. Check if ticket is already validated
  const [ticket] = await query<any>("SELECT state FROM tickets WHERE number = ?", [ticketId]);
  if (ticket && (ticket.state === 'Validated' || ticket.state?.toLowerCase() === 'validated')) {
    throw new Error("Cannot re-analyze a validated ticket.");
  }

  // 1. Check for Predefined Queries matching the problem
  const keywords = title.split(/\s+/).filter(w => w.length > 4);
  let matchingQuery: any = null;

  if (keywords.length > 0) {
    const qConditions = keywords.map(() => `description LIKE ?`).join(' OR ');
    const qParams = keywords.map(k => `%${k}%`);
    const rows = await query<any>(`SELECT * FROM predefined_queries WHERE isActive = 1 AND (${qConditions}) LIMIT 1`, qParams);
    if (rows && rows.length > 0) matchingQuery = rows[0];
  }

  let analysis: any;
  if (matchingQuery) {
    analysis = {
      rootCause: `Matched predefined pattern: ${matchingQuery.name}`,
      confidence: 95,
      urgency: "high",
      impactedTables: [],
      sqlProposal: matchingQuery.sql,
      recommendation: `Automated resolution via predefined query: ${matchingQuery.description}`,
      gostSummary: "Matched a known solution template. SQL extracted automatically."
    };
  } else {
    analysis = await generateAnalysisWithOllama(title, description);
  }

  // Generate a unique analysis_id for this analysis run
  const analysisId = generateId("ANALYSIS");

  // Auto-migrate if needed
  try {
    await execute("ALTER TABLE ai_analysis ADD COLUMN impacted_tables TEXT");
    console.log("Migration: added impacted_tables to ai_analysis");
  } catch (e: any) {
    // Column likely already exists
  }

  // Save to DB
  try {
    await execute(`
      INSERT INTO ai_analysis (incident_number, incident_description, root_cause, resolution_steps, suggested_sql, confidence_score, impacted_tables)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        incident_description = VALUES(incident_description),
        root_cause = VALUES(root_cause),
        resolution_steps = VALUES(resolution_steps),
        suggested_sql = VALUES(suggested_sql),
        confidence_score = VALUES(confidence_score),
        impacted_tables = VALUES(impacted_tables)
    `, [
      ticketId,
      description,
      analysis.rootCause,
      JSON.stringify(analysis.recommendation),
      analysis.sqlProposal,
      analysis.confidence / 100,
      JSON.stringify(analysis.impactedTables || [])
    ]);

    const impactedTablesStr = analysis.impactedTables?.map((t: any) => t.name).join(", ") || "None identified";
    const ghostResponseText = `FORS AGENT RESPONSE (PENDING):

Root Cause Analysis:
${analysis.rootCause}

Impacted Tables:
${impactedTablesStr}

Recommended Solution:
${analysis.recommendation}

SQL Solution:
${analysis.sqlProposal}

AI Confidence:
${analysis.confidence}%`;

    // Save "ghost response" in ticket details with pending status
    await query("UPDATE tickets SET state = 'Analysis Pending', comments = ? WHERE number = ?", [
      ghostResponseText,
      ticketId
    ]);

    // Log the action
    await logActivity("AI_ANALYSIS_GENERATED", {
      ticketId,
      details: {
        message: `Generated AI analysis for ${ticketId}`,
        analysisId,
        confidence: analysis.confidence,
        urgency: analysis.urgency
      }
    });

  } catch (err: any) {
    console.error("Failed to save analysis:", err);
    throw new Error(`DB Error: ${err.message}`);
  }

  return JSON.parse(JSON.stringify(analysis));
}

export async function chatWithGostAction(ticketId: string, message: string, history: any[] = []) {
  const sessionValue = await getSession();
  const userMatricule = sessionValue.user?.matricule || "UNKNOWN";

  // Find or create Conversation
  let conversationId = ticketId + "_conv";
  const convRows = await query<any>("SELECT conversation_id FROM conversations WHERE ticket_number = ?", [ticketId]);
  if (convRows.length > 0) {
    conversationId = convRows[0].conversation_id;
  } else {
    await query("INSERT INTO conversations (conversation_id, ticket_number, user_matricule) VALUES (?, ?, ?)", [conversationId, ticketId, userMatricule]);
  }

  // 1. Save User Prompt
  try {
    const qSaveUser = `
      INSERT INTO messages (conversation_id, user_matricule, role, content)
      VALUES (?, ?, 'User', ?)
    `;
    await query(qSaveUser, [conversationId, userMatricule, message]);

    // Log chat interaction
    await logActivity("CHAT_MESSAGE_SENT", {
      ticketId,
      userMatricule,
      details: { message: `User sent message: ${message.slice(0, 50)}...` }
    });

  } catch (err) {
    console.error("Failed to save user chat:", err);
  }

  const reply = await getGostChatResponse(message, history);

  // 2. Save AI Reply
  try {
    const qSaveAI = `
      INSERT INTO messages (conversation_id, user_matricule, role, content)
      VALUES (?, 'SYSTEM', 'AI', ?)
    `;
    await query(qSaveAI, [conversationId, reply]);

    // Log AI reply
    await query(
      "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
      ["SYSTEM", "CHAT_MESSAGE_REPLIED", JSON.stringify({ message: `AI replied for ticket ${ticketId}` })]
    );

  } catch (err) {
    console.error("Failed to save AI chat:", err);
  }

  return JSON.parse(JSON.stringify(reply));
}

export async function getChatMessagesForTicketAction(ticketId: string): Promise<ChatMessage[]> {
  const q = `
    SELECT m.id, m.conversation_id as conversationId, m.role, m.content, m.created_at as createdAt, m.user_matricule as senderName
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.conversation_id
    WHERE c.ticket_number = ?
    ORDER BY m.created_at ASC
  `;
  const rows = await query<any>(q, [ticketId]);
  const data = rows.map((r: any) => ({
    id: r.id.toString(),
    conversationId: r.conversationId,
    ticketId: ticketId, // added for components relying on ticketId
    role: r.role,
    content: r.content,
    createdAt: r.createdAt,
    senderName: r.senderName || (r.role === 'AI' ? 'GOST AI' : 'Agent')
  }));
  return JSON.parse(JSON.stringify(data));
}

/**
 * Hard-deletes a conversation by its conversation_id.
 * The SQL DELETE on Conversations cascades to the Messages table
 * (FK ON DELETE CASCADE), so all child messages are removed atomically.
 *
 * After deletion the /chat history route is revalidated so the
 * sidebar immediately reflects the change on next render.
 */
export async function deleteConversationAction(conversationId: string) {
  const session = await getSession();
  const userMatricule = session.user?.matricule || "UNKNOWN";

  // Fetch conversation metadata before deletion for audit logging
  const convRows = await query<any>(
    "SELECT conversation_id, ticket_number FROM conversations WHERE conversation_id = ?",
    [conversationId]
  );

  if (convRows.length === 0) {
    return { success: false, error: "Conversation not found" };
  }

  const ticketId = convRows[0].ticket_number;

  // Hard-delete: CASCADE will remove all messages rows automatically
  await query("DELETE FROM conversations WHERE conversation_id = ?", [conversationId]);

  // Audit trail
  await query(
    "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
    [
      userMatricule,
      "DELETE_CONVERSATION",
      JSON.stringify({
        message: `Hard-deleted conversation ${conversationId} (ticket ${ticketId})`,
        conversationId,
        ticketId,
      }),
    ]
  );

  // Revalidate both the history list and the specific ticket chat page
  revalidatePath("/chat");
  revalidatePath(`/chat/${ticketId}`);

  return { success: true };
}

export async function validateAnalysisAction(ticketId: string, currentAnalysis?: any) {
  const session = await getSession();
  const userMatricule = session.user?.matricule || "UNKNOWN";

  // 0. Pre-flight checks (outside transaction – read-only)
  const [ticket] = await query<any>("SELECT state, description FROM tickets WHERE number = ?", [ticketId]);
  if (!ticket) return { success: false, error: "Ticket not found" };
  if (ticket.state === 'Validated' || ticket.state?.toLowerCase() === 'validated') {
    return { success: false, error: "Ticket is already validated" };
  }

  // 1. Get existing analysis
  let [analysis] = await query<any>("SELECT * FROM ai_analysis WHERE incident_number = ?", [ticketId]);

  let resolutionSteps = 'Predefined Query / Manual validation';

  if (!analysis) {
    // Force create a dummy analysis record
    await execute(`
      INSERT INTO ai_analysis (incident_number, root_cause, resolution_steps, suggested_sql, confidence_score)
      VALUES (?, ?, ?, ?, ?)
    `, [
      ticketId,
      currentAnalysis?.rootCause || 'Manual/Predefined Validation',
      JSON.stringify(currentAnalysis?.recommendation || resolutionSteps),
      currentAnalysis?.sqlProposal || '',
      1.0
    ]);
    resolutionSteps = currentAnalysis?.recommendation || resolutionSteps;
  } else {
    // Update existing analysis if UI provided new data
    if (currentAnalysis) {
      await execute(`
        UPDATE ai_analysis 
        SET root_cause = ?, resolution_steps = ?, suggested_sql = ?
        WHERE incident_number = ?
      `, [
        currentAnalysis.rootCause || analysis.root_cause,
        JSON.stringify(currentAnalysis.recommendation || analysis.resolution_steps),
        currentAnalysis.sqlProposal || analysis.suggested_sql,
        ticketId
      ]);
      resolutionSteps = currentAnalysis.recommendation || analysis.resolution_steps;
    } else {
      resolutionSteps = analysis.resolution_steps || resolutionSteps;
    }
  }

  // 2. Transactional commit – both validated_incidents and ticket state update
  //    are committed atomically. If any step fails, everything rolls back.
  try {
    await transaction(async (conn) => {
      // 2a. Build a rich analysis snapshot to persist across both tables
      const _rootCause = (currentAnalysis?.rootCause) || (analysis?.root_cause) || 'Manual/Predefined Validation';
      const _sql = (currentAnalysis?.sqlProposal) || (analysis?.suggested_sql) || '';
      const _conf = analysis?.confidence_score ?? 1.0;
      let _res: any = resolutionSteps;
      try { _res = JSON.parse(resolutionSteps as string); } catch { }
      const _noteLines = [
        '=== AI Analysis Report ===',
        `Validated by: ${userMatricule}`,
        `Confidence: ${Math.round(Number(_conf) * 100)}%`,
        '',
        '--- Root Cause ---',
        _rootCause,
        '',
        '--- Resolution Steps ---',
        typeof _res === 'string' ? _res : JSON.stringify(_res, null, 2),
      ];
      if (_sql.trim()) _noteLines.push('', '--- Suggested SQL ---', _sql);
      const closeNotes = _noteLines.join('\n');

      // 2b. Update ai_analysis with consulted details and final solution
      await conn.execute(`
        UPDATE ai_analysis
        SET consulted_by = ?,
            consulted_at = NOW(),
            final_solution = ?
        WHERE incident_number = ?
      `, [
        userMatricule,
        closeNotes,
        ticketId
      ]);

      // 2c. Update ticket: state = Validated, close_notes = full analysis, comments = summary
      await conn.execute(
        "UPDATE tickets SET state = 'Validated', close_notes = ?, comments = ? WHERE number = ?",
        [closeNotes, `Solution validated by ${userMatricule}.`, ticketId]
      );

      // 2c. Audit log
      await logActivity("TICKET_VALIDATED", {
        ticketId,
        userMatricule,
        details: { message: `Validated AI analysis for ticket ${ticketId}` }
      });
    });
  } catch (err: any) {
    console.error("[validateAnalysisAction] Transaction failed:", err);
    return { success: false, error: err.message || "Validation transaction failed." };
  }

  return { success: true };
}

export async function rejectAnalysisAction(ticketId: string, reason: string = ""): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    const userMatricule = session.user?.matricule || "UNKNOWN";

    await query("UPDATE tickets SET state = 'Rejected', comments = ? WHERE number = ?", [
      `AI solution rejected by ${userMatricule}. Reason: ${reason}`,
      ticketId
    ]);

    await logActivity("TICKET_REJECTED", {
      ticketId,
      userMatricule,
      details: { message: `Rejected AI analysis for ticket ${ticketId}`, reason }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reject analysis" };
  }
}

export async function cleanupOldDataAction() {
  // 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  // Delete old conversations
  await query("DELETE FROM conversations WHERE created_at < ?", [thirtyDaysAgo]);

  // Delete old sessions
  await query("DELETE FROM sessions WHERE expires_at < NOW()");

  return { success: true };
}

/**
 * Logs a SQL execution event. 
 * This is called from the UI when a user runs a suggested or manual query.
 */
export async function logSqlExecutionAction(ticketId: string, sql: string, status: "success" | "error" = "success") {
  const session = await getSession();
  const userMatricule = session.user?.matricule || "UNKNOWN";

  return await logActivity("SQL_EXECUTED", {
    ticketId,
    userMatricule,
    details: {
      query: sql,
      status,
      message: `Executed SQL for ticket ${ticketId}`
    }
  });
}

/**
 * Safe SQL execution for the Lab.
 * Only allows SELECT queries and enforces limits.
 */
export async function executeLabSqlAction(sqlQuery: string, ticketId: string = "LAB_TEST") {
  const session = await getSession();
  const userMatricule = session.user?.matricule || "UNKNOWN";

  const isDestructive = /drop|delete|truncate|alter|insert|update|grant/i.test(sqlQuery);
  if (isDestructive) {
    return { success: false, error: "Only SELECT queries are allowed in the Analysis Lab for non-admin users." };
  }

  try {
    const start = performance.now();
    const results = await query<any>(sqlQuery);
    const timeMs = performance.now() - start;

    await logSqlExecutionAction(ticketId, sqlQuery, "success");

    return {
      success: true,
      count: results.length,
      timeMs,
      data: results.slice(0, 500)
    };
  } catch (err: any) {
    await logSqlExecutionAction(ticketId, sqlQuery, "error");
    return { success: false, error: err.message || "SQL Execution failed." };
  }
}

/**
 * Creates / upserts a ticket from a parsed ServiceNow XML import.
 * Inserts all 30 supported DB columns.  Called only when the user
 * clicks "Trigger Analysis" — NOT on import.
 */
export async function createTicketFromXmlAction(dbFields: Record<string, string | null>) {
  const q = `
    INSERT INTO tickets (
      number, short_description, description, state, priority,
      assignment_group, assigned_to, sys_class_name, sys_created_on,
      ref_incident_calendar_stc, ref_sc_request_calendar_stc,
      work_notes, work_notes_list, sla_due, made_sla, time_worked,
      sys_updated_on, sys_updated_by, sys_mod_count, opened_by,
      opened_at, calendar_duration, due_date, closed_at, close_notes,
      closed_by, comments, business_service, sys_created_by, u_response_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      short_description = VALUES(short_description),
      description       = VALUES(description),
      state             = VALUES(state),
      priority          = VALUES(priority),
      assignment_group  = VALUES(assignment_group),
      assigned_to       = VALUES(assigned_to),
      sys_updated_on    = VALUES(sys_updated_on),
      comments          = VALUES(comments),
      work_notes        = VALUES(work_notes),
      work_notes_list   = VALUES(work_notes_list),
      close_notes       = VALUES(close_notes),
      closed_at         = VALUES(closed_at),
      closed_by         = VALUES(closed_by)
  `;

  const values = [
    dbFields.number,
    dbFields.short_description,
    dbFields.description,
    dbFields.state,
    dbFields.priority,
    dbFields.assignment_group,
    dbFields.assigned_to,
    dbFields.sys_class_name,
    dbFields.sys_created_on,
    dbFields.ref_incident_calendar_stc,
    dbFields.ref_sc_request_calendar_stc,
    dbFields.work_notes,
    dbFields.work_notes_list,
    dbFields.sla_due,
    dbFields.made_sla,
    dbFields.time_worked,
    dbFields.sys_updated_on,
    dbFields.sys_updated_by,
    dbFields.sys_mod_count,
    dbFields.opened_by,
    dbFields.opened_at,
    dbFields.calendar_duration,
    dbFields.due_date,
    dbFields.closed_at,
    dbFields.close_notes,
    dbFields.closed_by,
    dbFields.comments,
    dbFields.business_service,
    dbFields.sys_created_by,
    dbFields.u_response_time,
  ];

  await query(q, values);

  // Audit trail
  await logActivity("XML_TICKET_IMPORTED", {
    ticketId: dbFields.number || "",
    details: { message: `Imported XML ticket ${dbFields.number}` }
  });

  return { success: true };
}

// -- EXPLORER ACTIONS --

export async function getExplorerMenus() {
  const q = `
    SELECT 
      m.id,
      m.title,
      m.description,
      m.parentId,
      m.order,
      (SELECT COUNT(*) FROM menus c WHERE c.parentId = m.id) AS childCount
    FROM menus m
    ORDER BY m.parentId IS NULL DESC, m.order ASC;
  `;
  const rows = await query<any>(q);
  return JSON.parse(JSON.stringify(rows));
}

export async function getExplorerTables() {
  const q = `
    SELECT 
      dt.id,
      dt.name,
      dt.description,
      COUNT(DISTINCT di.id) AS indexCount,
      COUNT(DISTINCT df.id) AS fieldCount,
      (
        SELECT COUNT(*) FROM transactions t
        WHERE FIND_IN_SET(dt.name, REPLACE(t.tables, ', ', ',')) > 0
      ) AS txnCount
    FROM database_tables dt
    LEFT JOIN database_indexes di ON di.tableId = dt.id
    LEFT JOIN database_fields df ON df.tableId = dt.id
    GROUP BY dt.id, dt.name, dt.description
    ORDER BY dt.name ASC;
  `;
  const rows = await query<any>(q);
  return JSON.parse(JSON.stringify(rows));
}

export async function getExplorerTransactions(tableName: string) {
  const q = `
    SELECT id, name, description, pgmType, language, sqlPg, tables, pgms
    FROM transactions
    WHERE FIND_IN_SET(?, REPLACE(tables, ', ', ',')) > 0
  `;
  const rows = await query<any>(q, [tableName]);
  return JSON.parse(JSON.stringify(rows));
}

/**
 * Updates a ticket's SAP module assignment.
 */
export async function updateTicketSapModuleAction(ticketId: string, sapModule: string) {
  const session = await getSession();
  const userMatricule = session.user?.matricule || "SYSTEM";
  const assignmentGroup = sapModule ? `SAP-${sapModule}` : "IT Support";

  await query("UPDATE tickets SET assignment_group = ?, sys_updated_on = NOW() WHERE number = ?", [assignmentGroup, ticketId]);

  await logActivity("TICKET_SAP_MODULE_UPDATED", {
    ticketId,
    userMatricule,
    details: {
      message: `Updated SAP module context to ${sapModule || 'None'}`,
      sapModule,
      assignmentGroup
    }
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true };
}

/**
 * Fetches recent notifications (new tickets, AI analysis completions).
 * Used by the Header's polling mechanism.
 */
export async function getNotificationsAction() {
  const q = `
    SELECT 
      'info' as type, 
      CONCAT('New AI Analysis: ', incident_number) as title, 
      root_cause as message, 
      created_at as timestamp,
      incident_number as linkId
    FROM ai_analysis 
    WHERE consulted_at IS NULL
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  const rows = await query<any>(q);
  return JSON.parse(JSON.stringify(rows));
}

/**
 * Fetches event logs for a specific ticket by scanning audit logs.
 */
export async function getEventLogsForTicketAction(ticketId: string) {
  const q = `
    SELECT action, user_matricule as attribution, created_at as timestamp, details
    FROM audit_logs
    WHERE details LIKE ?
    ORDER BY created_at DESC
    LIMIT 20
  `;
  const rows = await query<any>(q, [`%${ticketId}%`]);

  return rows.map(r => {
    let msg = r.action;
    try {
      const details = JSON.parse(r.details);
      if (details.message) msg = details.message;
    } catch (e) { }

    return {
      message: msg,
      timestamp: r.timestamp,
      attribution: r.attribution
    };
  });
}

/**
 * Executes a SQL preview for a ticket's suggested solution.
 */
export async function executeSqlPreviewAction(ticketId: string, sql: string) {
  const session = await getSession();

  // Safety check: Only SELECT allowed
  const isDestructive = /drop|delete|truncate|alter|insert|update|grant/i.test(sql);
  if (isDestructive) {
    return { success: false, columns: [], rows: [], error: "Only SELECT queries are allowed for preview." };
  }

  try {
    const results = await query<any>(sql);
    const columns = results.length > 0 ? Object.keys(results[0]) : [];

    await logSqlExecutionAction(ticketId, sql, "success");

    return {
      success: true,
      columns,
      rows: results.slice(0, 10), // Preview limit
      error: null
    };
  } catch (err: any) {
    await logSqlExecutionAction(ticketId, sql, "error");
    return { success: false, columns: [], rows: [], error: err.message || "SQL Execution failed." };
  }
}

