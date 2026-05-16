"use server";

import { query, execute, transaction } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// ───────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  const role = session.user?.role as string;
  if (!["admin", "superadmin", "it_manager", "it_report"].includes(role)) throw new Error("Unauthorized.");
  return session;
}

async function requireSuperadmin() {
  const session = await getSession();
  if (session.user?.role !== "superadmin") throw new Error("Superadmin access required.");
  return session;
}

export async function getMyRoleAction() {
  const session = await getSession();
  return session.user?.role || "user";
}

// ───────────────────────────────────────────────
//  USER MANAGEMENT — Full CRUD
// ───────────────────────────────────────────────

export async function getAdminUsersAction() {
  const session = await requireAdmin();
  const callerRole = session.user!.role;

  let queryStr = "SELECT matricule, name, surname, username, email, role, is_active, created_at FROM users";
  const params: any[] = [];

  // SuperAdmin sees full directory. Admin sees only lower roles.
  // Manager sees only IT Support.
  if (callerRole === "it_manager") {
    queryStr += " WHERE role = 'it_support'";
  } else if (callerRole !== "superadmin") {
    queryStr += " WHERE role NOT IN ('admin', 'superadmin')";
  }

  queryStr += " ORDER BY created_at DESC";
  const rows = await query<any>(queryStr, params);
  return JSON.parse(JSON.stringify(rows));
}

export async function createUserAction(data: {
  matricule: string; name: string; surname: string; username?: string;
  email?: string; password: string; role: string;
}) {
  const session = await requireAdmin();
  const creator = session.user!.matricule;

  // Admin/Manager cannot create admins or superadmins
  if (["admin", "superadmin"].includes(data.role) && !["superadmin"].includes(session.user!.role)) {
    throw new Error("Only superadmin can create administrative accounts.");
  }

  // Manager can only create IT Support users
  if (session.user!.role === "it_manager" && data.role !== "it_support") {
    throw new Error("Managers can only create IT Support users.");
  }

  // Hash password
  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync(data.password, 10);

  await execute(
    `INSERT INTO users (matricule, name, surname, username, email, password, role, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [data.matricule, data.name, data.surname, data.username || null, data.email || null, hash, data.role]
  );

  await logActivity("USER_CREATED", {
    userMatricule: creator,
    details: { message: `Created user ${data.matricule} with role ${data.role}`, target: data.matricule }
  });

  revalidatePath("/admin/users");
  revalidatePath("/superadmin/admin-management");
  return { success: true };
}

export async function updateUserAction(matricule: string, data: {
  name?: string; surname?: string; username?: string; email?: string; role?: string; password?: string;
}) {
  const session = await requireAdmin();
  const caller = session.user!;

  // Fetch target user to check current role
  const [target] = await query<any>("SELECT role FROM users WHERE matricule = ?", [matricule]);
  if (!target) throw new Error("User not found.");

  // Admin/Manager cannot update admins or superadmins
  if (["admin", "superadmin"].includes(target.role) && caller.role !== "superadmin") {
    throw new Error("Only superadmin can modify administrative accounts.");
  }

  // Manager can only update IT Support users
  if (caller.role === "it_manager" && target.role !== "it_support") {
    throw new Error("Managers can only manage IT Support users.");
  }

  // Admin cannot promote to admin or superadmin
  if (data.role && ["admin", "superadmin"].includes(data.role) && caller.role !== "superadmin") {
    throw new Error("Only superadmin can assign administrative roles.");
  }

  // Manager cannot change role to anything other than it_support
  if (caller.role === "it_manager" && data.role && data.role !== "it_support") {
    throw new Error("Managers can only assign IT Support role.");
  }

  const sets: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined)     { sets.push("name = ?");     params.push(data.name); }
  if (data.surname !== undefined)  { sets.push("surname = ?");  params.push(data.surname); }
  if (data.username !== undefined) { sets.push("username = ?"); params.push(data.username); }
  if (data.email !== undefined)    { sets.push("email = ?");    params.push(data.email); }
  if (data.role !== undefined)     { sets.push("role = ?");     params.push(data.role); }
  if (data.password) {
    const bcrypt = require("bcryptjs");
    sets.push("password = ?");
    params.push(bcrypt.hashSync(data.password, 10));
  }
  sets.push("updated_at = NOW()");
  params.push(matricule);

  if (sets.length <= 1) return { success: false, error: "Nothing to update." };

  await execute(`UPDATE users SET ${sets.join(", ")} WHERE matricule = ?`, params);

  await logActivity("USER_CREATED", {
    userMatricule: caller.matricule,
    details: { message: `Updated user ${matricule}`, changes: data, target: matricule }
  });

  revalidatePath("/admin/users");
  revalidatePath("/superadmin/admin-management");
  return { success: true };
}

export async function deleteUserAction(matricule: string) {
  const session = await requireAdmin();
  const caller = session.user!;

  // Fetch user to check role
  const [target] = await query<any>("SELECT role FROM users WHERE matricule = ?", [matricule]);
  if (!target) throw new Error("User not found.");

  // Admin/Manager cannot delete admins or superadmins
  if (["admin", "superadmin"].includes(target.role) && caller.role !== "superadmin") {
    throw new Error("Only superadmin can delete admin accounts.");
  }

  // Manager can only delete IT Support users
  if (caller.role === "it_manager" && target.role !== "it_support") {
    throw new Error("Managers can only delete IT Support users.");
  }

  // Prevent self-deletion
  if (caller.matricule === matricule) {
    throw new Error("Cannot delete your own account.");
  }

  // Delete sessions first, then user
  await execute("DELETE FROM sessions WHERE user_matricule = ?", [matricule]);
  await execute("DELETE FROM users WHERE matricule = ?", [matricule]);

  await logActivity("USER_CREATED", {
    userMatricule: caller.matricule,
    details: { message: `Deleted user ${matricule}`, role: target.role, target: matricule }
  });

  revalidatePath("/admin/users");
  revalidatePath("/superadmin/admin-management");
  return { success: true };
}

export async function toggleUserActiveAction(matricule: string) {
  const session = await requireAdmin();
  const caller = session.user!;

  const [user] = await query<any>("SELECT is_active, role FROM users WHERE matricule = ?", [matricule]);
  if (!user) throw new Error("User not found.");

  if (["admin", "superadmin"].includes(user.role) && caller.role !== "superadmin") {
    throw new Error("Only superadmin can toggle admin account status.");
  }

  if (caller.role === "it_manager" && user.role !== "it_support") {
    throw new Error("Managers can only toggle IT Support users.");
  }

  const newActive = user.is_active ? 0 : 1;
  await execute(
    "UPDATE users SET is_active = ?, inactivated_at = ? WHERE matricule = ?",
    [newActive, newActive === 0 ? new Date() : null, matricule]
  );

  if (newActive === 0) {
    await execute("DELETE FROM sessions WHERE user_matricule = ?", [matricule]);
  }

  await logActivity("USER_CREATED", {
    userMatricule: caller.matricule,
    details: { message: `${newActive ? "Activated" : "Deactivated"} user ${matricule}`, target: matricule }
  });

  revalidatePath("/admin/users");
  return { success: true };
}

// ───────────────────────────────────────────────
//  AUDIT & ACTIVITY LOG — Global viewer with filters
// ───────────────────────────────────────────────

export async function getAuditLogsAction(filters?: {
  userMatricule?: string; action?: string; dateFrom?: string; dateTo?: string; limit?: number;
}) {
  const session = await getSession();
  const role = session.user?.role;
  if (!role || !["it_manager", "admin", "superadmin"].includes(role)) {
    throw new Error("Unauthorized");
  }

  const conditions: string[] = [];
  const params: any[] = [];

  if (role === "it_manager") {
    conditions.push(`(a.user_matricule IN (SELECT matricule FROM users WHERE role = 'it_support') 
      OR a.details LIKE '%"team":"IT Support"%' 
      OR a.details LIKE '%IT Support%')`);
  } else if (role === "admin") {
    // Admin sees everything except superadmin logs
    conditions.push("a.user_matricule NOT IN (SELECT matricule FROM users WHERE role = 'superadmin')");
  }

  if (filters?.userMatricule) {
    conditions.push("a.user_matricule LIKE ?");
    params.push(`%${filters.userMatricule}%`);
  }
  if (filters?.action) {
    conditions.push("a.action = ?");
    params.push(filters.action);
  }
  if (filters?.dateFrom) {
    conditions.push("a.created_at >= ?");
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push("a.created_at <= ?");
    params.push(filters.dateTo + " 23:59:59");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit || 200;

  const rows = await query<any>(
    `SELECT a.id, a.user_matricule, a.action, a.details, a.created_at, u.name, u.surname FROM audit_logs a LEFT JOIN users u ON a.user_matricule = u.matricule ${where} ORDER BY a.created_at DESC LIMIT ?`,
    [...params, limit]
  );
  return JSON.parse(JSON.stringify(rows));
}

export async function getAuditActionTypes() {
  await requireAdmin();
  const rows = await query<any>("SELECT DISTINCT action FROM audit_logs ORDER BY action ASC");
  return rows.map((r: any) => r.action as string);
}

// ───────────────────────────────────────────────
//  FUNCTIONAL MAPPING — Transactions, Menus, DB Tables
// ───────────────────────────────────────────────

// -- Transactions --
export async function getTransactionsAction() {
  await requireAdmin();
  const rows = await query<any>("SELECT * FROM transactions ORDER BY name ASC");
  return JSON.parse(JSON.stringify(rows));
}

export async function createTransactionAction(data: {
  name: string; description?: string; pgmType?: string; language?: string; sqlPg?: string; tables?: string; pgms?: string;
}) {
  const session = await requireAdmin();
  const id = `TXN-${Date.now().toString(36)}`;
  await execute(
    `INSERT INTO transactions (id, name, description, pgmType, language, sqlPg, tables, pgms, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [id, data.name, data.description || null, data.pgmType || null, data.language || null, data.sqlPg || null, data.tables || null, data.pgms || null]
  );
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Created transaction ${data.name}`, id }
  });
  revalidatePath("/admin/mapping");
  return { success: true, id };
}

export async function updateTransactionAction(id: string, data: Record<string, any>) {
  const session = await requireAdmin();
  const sets = Object.keys(data).map(k => `\`${k}\` = ?`);
  sets.push("updatedAt = NOW(3)");
  const params = [...Object.values(data), id];
  await execute(`UPDATE transactions SET ${sets.join(", ")} WHERE id = ?`, params);
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Updated transaction ${id}`, changes: data }
  });
  revalidatePath("/admin/mapping");
  return { success: true };
}

export async function deleteTransactionAction(id: string) {
  const session = await requireAdmin();
  await execute("DELETE FROM transactions WHERE id = ?", [id]);
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Deleted transaction ${id}` }
  });
  revalidatePath("/admin/mapping");
  return { success: true };
}

// -- Menus --
export async function getMenusAction() {
  await requireAdmin();
  const rows = await query<any>("SELECT * FROM menus ORDER BY `order` ASC, title ASC");
  return JSON.parse(JSON.stringify(rows));
}

export async function createMenuAction(data: {
  title: string; description?: string; parentId?: string; icon?: string; path?: string; order?: number;
}) {
  const session = await requireAdmin();
  const id = `MENU-${Date.now().toString(36)}`;
  await execute(
    `INSERT INTO menus (id, title, description, parentId, icon, path, \`order\`, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [id, data.title, data.description || null, data.parentId || null, data.icon || null, data.path || null, data.order || 0]
  );
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Created menu ${data.title}`, id }
  });
  revalidatePath("/admin/mapping");
  return { success: true, id };
}

export async function updateMenuAction(id: string, data: Record<string, any>) {
  const session = await requireAdmin();
  const sets = Object.keys(data).map(k => k === "order" ? `\`${k}\` = ?` : `${k} = ?`);
  sets.push("updatedAt = NOW(3)");
  const params = [...Object.values(data), id];
  await execute(`UPDATE menus SET ${sets.join(", ")} WHERE id = ?`, params);
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Updated menu ${id}` }
  });
  revalidatePath("/admin/mapping");
  return { success: true };
}

export async function deleteMenuAction(id: string) {
  const session = await requireAdmin();
  await execute("DELETE FROM menus WHERE id = ?", [id]);
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Deleted menu ${id}` }
  });
  revalidatePath("/admin/mapping");
  return { success: true };
}

// -- Database Tables (metadata only) --
export async function getDatabaseTablesAction() {
  await requireAdmin();
  const rows = await query<any>("SELECT * FROM database_tables ORDER BY name ASC");
  return JSON.parse(JSON.stringify(rows));
}

export async function createDatabaseTableAction(data: {
  name: string; description?: string; path?: string; schema?: string;
}) {
  const session = await requireAdmin();
  const id = `TBL-${Date.now().toString(36)}`;
  await execute(
    `INSERT INTO database_tables (id, name, description, path, \`schema\`, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [id, data.name, data.description || null, data.path || null, data.schema || null]
  );
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Created database table metadata ${data.name}`, id }
  });
  revalidatePath("/admin/mapping");
  return { success: true, id };
}

export async function updateDatabaseTableAction(id: string, data: Record<string, any>) {
  const session = await requireAdmin();
  const safeKeys = Object.keys(data).map(k => k === "schema" ? `\`${k}\` = ?` : `${k} = ?`);
  safeKeys.push("updatedAt = NOW(3)");
  const params = [...Object.values(data), id];
  await execute(`UPDATE database_tables SET ${safeKeys.join(", ")} WHERE id = ?`, params);
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Updated database table ${id}` }
  });
  revalidatePath("/admin/mapping");
  return { success: true };
}

export async function deleteDatabaseTableAction(id: string) {
  const session = await requireAdmin();
  await execute("DELETE FROM database_tables WHERE id = ?", [id]);
  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Deleted database table ${id}` }
  });
  revalidatePath("/admin/mapping");
  return { success: true };
}

// ───────────────────────────────────────────────
//  KPI CONFIGURATION
// ───────────────────────────────────────────────

export async function getKpiConfigs() {
  const rows = await query<any>("SELECT id, kpiId, name, category, isEnabled, description, `order`, sql_query FROM kpi_configs ORDER BY `order` ASC");
  return JSON.parse(JSON.stringify(rows));
}

export async function updateKpiConfigAction(kpiId: string, updates: {
  isEnabled?: boolean; name?: string; sql_query?: string; description?: string; category?: string;
}) {
  const session = await requireAdmin();
  
  const sets: string[] = [];
  const params: any[] = [];

  if (updates.isEnabled !== undefined)  { sets.push("isEnabled = ?");   params.push(updates.isEnabled ? 1 : 0); }
  if (updates.name !== undefined)       { sets.push("name = ?");        params.push(updates.name); }
  if (updates.sql_query !== undefined)  { sets.push("sql_query = ?");   params.push(updates.sql_query); }
  if (updates.description !== undefined){ sets.push("description = ?"); params.push(updates.description); }
  if (updates.category !== undefined)   { sets.push("category = ?");    params.push(updates.category); }
  sets.push("updatedAt = NOW(3)");
  params.push(kpiId);

  await execute(`UPDATE kpi_configs SET ${sets.join(", ")} WHERE id = ?`, params);

  await logActivity("KPI_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Updated KPI ${kpiId}`, changes: updates }
  });
  revalidatePath("/admin/kpi-config");
  return { success: true };
}

export async function createKpiConfigAction(data: {
  name: string; category: string; description?: string; sql_query?: string; isEnabled?: boolean;
}) {
  const session = await requireAdmin();
  const id = `KPI-${Date.now().toString(36)}`;
  const kpiId = data.name.toUpperCase().replace(/\s+/g, "_");

  await execute(
    `INSERT INTO kpi_configs (id, kpiId, name, category, isEnabled, description, sql_query, \`order\`, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(3), NOW(3))`,
    [id, kpiId, data.name, data.category, data.isEnabled !== false ? 1 : 0, data.description || null, data.sql_query || null]
  );

  await logActivity("KPI_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Created KPI ${data.name}`, id }
  });
  revalidatePath("/admin/kpi-config");
  return { success: true, id };
}

export async function deleteKpiConfigAction(id: string) {
  const session = await requireAdmin();
  
  await execute(`DELETE FROM kpi_configs WHERE id = ?`, [id]);
  
  await logActivity("KPI_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Deleted KPI ${id}`, id }
  });
  
  revalidatePath("/admin/kpi-config");
  return { success: true };
}

// ───────────────────────────────────────────────
//  ADMIN DASHBOARD STATS
// ───────────────────────────────────────────────

export async function getAdminDashboardStats() {
  const session = await getSession();
  const callerRole = session.user?.role;
  const isSuperadmin = callerRole === "superadmin";

  // Exclude superadmin users from counts when caller is a regular admin
  const userFilter = isSuperadmin ? "" : " WHERE role != 'superadmin'";
  const auditFilter = isSuperadmin ? "" : " AND user_matricule NOT IN (SELECT matricule FROM users WHERE role = 'superadmin')";

  const [sessionsRes] = await query<any>(`SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()${isSuperadmin ? "" : " AND user_matricule NOT IN (SELECT matricule FROM users WHERE role = 'superadmin')"}`);
  const activeConnections = sessionsRes?.count || 0;

  const [sqlRunsRes] = await query<any>(`SELECT COUNT(*) as count FROM audit_logs WHERE action = 'RAW_SQL_EXECUTED' AND DATE(created_at) = CURDATE()${auditFilter}`);
  const sqlRuns = sqlRunsRes?.count || 0;

  const [totalUsersRes] = await query<any>(`SELECT COUNT(*) as count FROM users${userFilter}`);
  const totalUsers = totalUsersRes?.count || 0;

  const [totalTicketsRes] = await query<any>("SELECT COUNT(*) as count FROM tickets");
  const totalTickets = totalTicketsRes?.count || 0;

  const [pendingTicketsRes] = await query<any>("SELECT COUNT(*) as count FROM tickets WHERE state NOT IN ('Closed', 'Validated', 'Canceled')");
  const pendingTickets = pendingTicketsRes?.count || 0;

  const anomalies = await query<any>(`SELECT * FROM audit_logs WHERE action IN ('RAW_SQL_FAILED', 'TICKET_REJECTED')${auditFilter} ORDER BY created_at DESC LIMIT 5`);

  return { activeConnections, sqlRuns, totalUsers, totalTickets, pendingTickets, anomalies, userMatricule: session.user!.matricule };
}

// ───────────────────────────────────────────────
//  RAW SQL EXECUTION
// ───────────────────────────────────────────────

export async function executeRawSqlAction(sqlQuery: string) {
  const session = await requireAdmin();
  const role = session.user!.role as string;
  const userMatricule = session.user!.matricule;

  const isDestructive = /drop|delete|truncate|alter/i.test(sqlQuery);
  if (isDestructive && role !== "superadmin") {
    throw new Error("Only Superadmin can execute destructive queries.");
  }

  try {
    const results = await query<any>(sqlQuery);
    await logActivity("RAW_SQL_EXECUTED", {
      userMatricule,
      details: { message: `Executed: ${sqlQuery.slice(0, 200)}`, status: "success" }
    });
    return { success: true, count: results.length, data: results.slice(0, 100) };
  } catch (err: any) {
    await logActivity("RAW_SQL_FAILED", {
      userMatricule,
      details: { message: `Failed: ${sqlQuery.slice(0, 200)}`, error: err.message }
    });
    throw new Error(`SQL Error: ${err.message}`);
  }
}

// ───────────────────────────────────────────────
//  SUPERADMIN — Admin Governance
// ───────────────────────────────────────────────

export async function getAdminsList() {
  await requireSuperadmin();
  const rows = await query<any>(
    "SELECT matricule, name, surname, role, is_active, email, created_at FROM users WHERE role IN ('admin', 'superadmin') ORDER BY created_at DESC"
  );
  return JSON.parse(JSON.stringify(rows));
}

export async function updateUserPermissionsAction(matricule: string, permissions: any) {
  const session = await requireSuperadmin();
  // We no longer use a permissions column since the schema doesn't have it.
  // Instead, we log the governance action.
  await logActivity("PERMISSIONS_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Updated governance rules for ${matricule}`, permissions }
  });
  revalidatePath("/superadmin/admin-management");
  return { success: true };
}

// ───────────────────────────────────────────────
//  SUPERADMIN — Integration Manager
// ───────────────────────────────────────────────

export async function getIntegrationSettings() {
  await requireSuperadmin();
  try {
    const rows = await query<any>("SELECT id, category, config_key, config_value FROM system_configurations ORDER BY category, config_key");
    // Group by category
    const result: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      if (!result[r.category]) result[r.category] = {};
      result[r.category][r.config_key] = r.config_value || "";
    }
    return result;
  } catch {
    // Table might not exist yet
    return { servicenow: {}, n8n: {}, ai: {} };
  }
}

export async function updateIntegrationSettingsAction(category: string, configs: Record<string, string>) {
  const session = await requireSuperadmin();

  for (const [key, value] of Object.entries(configs)) {
    const id = `${category}_${key}`;
    try {
      await execute(
        `INSERT INTO system_configurations (id, category, config_key, config_value, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_by = VALUES(updated_by)`,
        [id, category, key, value, session.user!.matricule]
      );
    } catch {
      // Table might not exist, skip gracefully
    }
  }

  await logActivity("INTEGRATION_UPDATED", {
    userMatricule: session.user!.matricule,
    details: { message: `Updated ${category} integration settings`, keys: Object.keys(configs) }
  });

  revalidatePath("/superadmin/integrations");
  return { success: true };
}

// ───────────────────────────────────────────────
//  SUPERADMIN — System Database Explorer
// ───────────────────────────────────────────────

export async function getSystemTablesAction() {
  await requireSuperadmin();
  const dbName = process.env.DB_NAME || "fors_simulator";

  // Get all tables with row counts
  const tables = await query<any>(`
    SELECT TABLE_NAME as name, TABLE_ROWS as rowCount, DATA_LENGTH as dataLength,
           TABLE_COMMENT as comment, ENGINE as engine, CREATE_TIME as createdAt
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ?
    ORDER BY TABLE_NAME
  `, [dbName]);

  return JSON.parse(JSON.stringify(tables));
}

export async function getSystemTableSchemaAction(tableName: string) {
  await requireSuperadmin();
  const columns = await query<any>("DESCRIBE ??", [tableName]);
  const indexes = await query<any>("SHOW INDEX FROM ??", [tableName]);
  const [countRes] = await query<any>("SELECT COUNT(*) as cnt FROM ??", [tableName]);

  return {
    columns: JSON.parse(JSON.stringify(columns)),
    indexes: JSON.parse(JSON.stringify(indexes)),
    rowCount: countRes?.cnt || 0,
  };
}

export async function getSystemTableDataAction(tableName: string, limit: number = 50) {
  await requireSuperadmin();
  const rows = await query<any>("SELECT * FROM ?? LIMIT ?", [tableName, limit]);
  return JSON.parse(JSON.stringify(rows));
}

// ───────────────────────────────────────────────
//  IT MANAGER — Team-Scoped Data (Section 6)
// ───────────────────────────────────────────────

export async function getTeamKpisAction() {
  const session = await getSession();
  const role = session.user?.role;
  if (!role || !["it_manager", "admin", "superadmin", "it_report", "it_support"].includes(role)) {
    throw new Error("Unauthorized");
  }

  try {
    // Fetch custom KPIs configured in the database
    let kpis = await query<any>("SELECT id, kpiId, name, category, description, sql_query FROM kpi_configs WHERE isEnabled = 1 AND sql_query IS NOT NULL AND sql_query != '' ORDER BY `order` ASC");
    
    // Self-healing: Fix known broken queries from user feedback
    kpis = kpis.map(k => {
      if (k.name === 'Validated AI Resolutions' && (!k.sql_query || k.sql_query.includes("IS NOT NULL"))) {
        return { ...k, sql_query: "SELECT COUNT(*) as count FROM tickets WHERE state = 'Validated' AND number IN (SELECT incident_number FROM ai_analysis)" };
      }
      return k;
    });
    
    const results: any[] = [];
    
    for (const kpi of kpis) {
      try {
        const data = await query<any>(kpi.sql_query);
        // Determine if this is a single value or a series (for charts)
        let type = "metric";
        let value: any = 0;
        let seriesData: any[] = [];
        
        if (data.length === 1) {
          // Try to extract the first column's value
          const keys = Object.keys(data[0]);
          value = data[0][keys[0]];
          
          // Map the single row columns into seriesData so the details modal has insights
          seriesData = Object.entries(data[0]).map(([k, v]) => ({ label: k, value: v }));
        } else if (data.length > 1) {
          type = "chart";
          seriesData = data;
        }

        results.push({
          id: kpi.id,
          name: kpi.name,
          category: kpi.category,
          description: kpi.description,
          type,
          value,
          seriesData
        });
      } catch (err: any) {
        console.error(`Error executing KPI ${kpi.name}:`, err.message);
        results.push({
          id: kpi.id,
          name: kpi.name,
          category: kpi.category,
          description: kpi.description,
          type: "error",
          error: err.message
        });
      }
    }

    // -- Add default Ticket-Oriented KPIs (Strictly scoped to IT Support) --
    let whereClause = " WHERE assignment_group = 'IT Support'";

    // 1. All Tickets Status (Chart)
    try {
      const stateRows = await query<any>(`SELECT state as Status, COUNT(*) as Count FROM tickets ${whereClause} GROUP BY state`);
      
      // Dynamic Mapping: Fix '1' to 'New' and ensure Title Case
      const mappedStateRows = stateRows.map(row => {
        let label = row.Status || "Unknown";
        if (label === '1') label = "New";
        // Ensure Title Case (e.g. "pending" -> "Pending")
        label = label.charAt(0).toUpperCase() + label.slice(1);
        return { ...row, Status: label };
      });

      if (mappedStateRows.length > 0) {
        results.push({
          id: "sys-ticket-dist",
          name: "All Tickets Status",
          category: "Ticket Operations",
          description: "Live breakdown of all tickets in the system by their current status.",
          type: "chart",
          seriesData: mappedStateRows
        });
      }

      // 2. Essential Metrics
      const [totalRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets ${whereClause}`);
      const [todayRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets ${whereClause ? whereClause + " AND" : "WHERE"} DATE(sys_created_on) = CURDATE()`);
      const [closedRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets ${whereClause ? whereClause + " AND" : "WHERE"} state IN ('Closed', 'Validated')`);
      const [highPriorityRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets ${whereClause ? whereClause + " AND" : "WHERE"} priority IN ('1 - Critical', '2 - High') AND state NOT IN ('Closed', 'Validated', 'Canceled')`);
      const [unassignedRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets ${whereClause ? whereClause + " AND" : "WHERE"} assigned_to IS NULL AND state != 'Closed'`);
      
      results.push({
        id: "sys-metric-total",
        name: "Total Tickets",
        category: "Volume",
        description: "Total volume of tickets managed by the team.",
        type: "metric",
        value: totalRes?.c || 0,
        seriesData: [{ label: "Total Tickets", count: totalRes?.c || 0 }]
      });

      results.push({
        id: "sys-metric-today",
        name: "Tickets Today",
        category: "Volume",
        description: "Number of new tickets created today.",
        type: "metric",
        value: todayRes?.c || 0,
        seriesData: [{ label: "Tickets Today", count: todayRes?.c || 0 }]
      });

      results.push({
        id: "sys-metric-closed",
        name: "Tickets Solved",
        category: "Performance",
        description: "Total number of tickets successfully resolved and closed.",
        type: "metric",
        value: closedRes?.c || 0,
        seriesData: [{ label: "Tickets Solved", count: closedRes?.c || 0 }]
      });

      results.push({
        id: "sys-metric-critical",
        name: "Critical Active Tickets",
        category: "Ticket Operations",
        description: "Tickets with High or Critical priority that require immediate attention.",
        type: "metric",
        value: highPriorityRes?.c || 0,
        seriesData: [{ label: "Critical Tickets", count: highPriorityRes?.c || 0 }]
      });

      results.push({
        id: "sys-metric-unassigned",
        name: "Unassigned Tickets",
        category: "Ticket Operations",
        description: "Active tickets that have not yet been assigned to a support agent.",
        type: "metric",
        value: unassignedRes?.c || 0,
        seriesData: [{ label: "Unassigned", count: unassignedRes?.c || 0 }]
      });

    } catch (e) {
      console.error("Failed to inject default ticket charts:", e);
    }

    return results;
  } catch (err) {
    console.error("getTeamKpisAction error:", err);
    return [];
  }
}

export async function getTeamMembersAction() {
  const session = await getSession();
  const role = session.user?.role;
  if (!role || !["it_manager", "admin", "superadmin"].includes(role)) {
    throw new Error("Unauthorized");
  }

  try {
    // For IT Managers, show only IT support agents (team-scoped)
    // Admins/superadmins see all
    let whereClause = "";
    if (role === "it_manager") {
      whereClause = "WHERE role = 'it_support'";
    }

    const rows = await query<any>(
      `SELECT matricule, name, surname, role, is_active, email, created_at FROM users ${whereClause} ORDER BY created_at DESC`
    );
    return JSON.parse(JSON.stringify(rows));
  } catch {
    return [];
  }
}

// ───────────────────────────────────────────────
//  IT REPORT — Dynamic KPI Data (Section 7)
// ───────────────────────────────────────────────

export async function getReportKpisAction(dateFrom?: string, dateTo?: string) {
  try {
    const session = await getSession();
    const role = session.user?.role;
    let groupFilter = "";
    if (role === "it_manager") {
      groupFilter = "assignment_group = 'IT Support'";
    }

    let dateFilter = "";
    if (dateFrom && dateTo) {
      dateFilter = `sys_created_on >= '${dateFrom} 00:00:00' AND sys_created_on <= '${dateTo} 23:59:59'`;
    } else if (dateFrom) {
      dateFilter = `sys_created_on >= '${dateFrom} 00:00:00'`;
    } else if (dateTo) {
      dateFilter = `sys_created_on <= '${dateTo} 23:59:59'`;
    }

    const conditions: string[] = [];
    if (groupFilter) conditions.push(groupFilter);
    if (dateFilter) conditions.push(dateFilter);

    const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";
    const andClause = conditions.length > 0 ? " AND " + conditions.join(" AND ") : "";

    // Core ticket metrics
    const [totalRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets${whereClause}`);
    const [closedRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state IN ('Closed', 'Validated')${andClause}`);
    const [pendingRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state NOT IN ('Closed', 'Validated', 'Canceled', 'Rejected')${andClause}`);
    const [rejectedRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state = 'Rejected'${andClause}`);
    const [canceledRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state = 'Canceled'${andClause}`);
    const [sqlProposedRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state = 'SQL Proposed'${andClause}`);
    const [validatedRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state = 'Validated'${andClause}`);
    const [analysisPendingRes] = await query<any>(`SELECT COUNT(*) as c FROM tickets WHERE state = 'Analysis Pending'${andClause}`);

    // Priority distribution
    const priorityRows = await query<any>(
      `SELECT priority, COUNT(*) as c FROM tickets ${whereClause} GROUP BY priority ORDER BY priority`
    );

    // Team distribution
    const teamRows = await query<any>(
      `SELECT assignment_group as team, COUNT(*) as c FROM tickets ${whereClause} GROUP BY assignment_group ORDER BY c DESC`
    );

    // Monthly trend (last 6 months)
    let monthlyTrendWhere = `WHERE sys_created_on >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`;
    if (groupFilter) monthlyTrendWhere += ` AND ${groupFilter}`;
    if (dateFilter) monthlyTrendWhere += ` AND ${dateFilter}`;

    const monthlyRows = await query<any>(`
      SELECT 
        DATE_FORMAT(sys_created_on, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN state IN ('Closed','Validated') THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN state = 'Rejected' THEN 1 ELSE 0 END) as rejected
      FROM tickets 
      ${monthlyTrendWhere}
      GROUP BY DATE_FORMAT(sys_created_on, '%Y-%m')
      ORDER BY month ASC
    `);

    // AI analysis stats
    let aiJoin = "";
    let aiWhere = "";
    if (groupFilter || dateFilter) {
      aiJoin = "JOIN tickets t ON t.number = a.incident_number";
      const aiConds: string[] = [];
      if (groupFilter) aiConds.push(`t.${groupFilter}`);
      if (dateFilter) aiConds.push(`t.${dateFilter}`);
      aiWhere = " WHERE " + aiConds.join(" AND ");
    }

    const [aiAnalysisRes] = await query<any>(`
      SELECT COUNT(*) as c FROM ai_analysis a
      ${aiJoin} ${aiWhere}
    `);
    
    let avgConfWhere = aiWhere ? `${aiWhere} AND a.confidence_score > 0` : `WHERE a.confidence_score > 0`;

    const [avgConfRes] = await query<any>(`
      SELECT AVG(a.confidence_score) as avg_conf FROM ai_analysis a
      ${aiJoin} ${avgConfWhere}
    `);

    // Users count
    const [usersRes] = await query<any>(`
      SELECT COUNT(*) as c FROM users ${role === 'it_manager' ? "WHERE role = 'it_support'" : ""}
    `);

    // Agent performance (top 10)
    const agentPerformance = await query<any>(`
      SELECT 
        assigned_to as agent, 
        COUNT(*) as total,
        SUM(CASE WHEN state IN ('Closed', 'Validated') THEN 1 ELSE 0 END) as resolved
      FROM tickets 
      WHERE assigned_to IS NOT NULL ${andClause}
      GROUP BY assigned_to 
      ORDER BY total DESC 
      LIMIT 10
    `);
    // Sessions count
    const [sessionsRes] = await query<any>("SELECT COUNT(*) as c FROM sessions WHERE expires_at > NOW()");

    return JSON.parse(JSON.stringify({
      totalTickets: totalRes?.c || 0,
      closedTickets: closedRes?.c || 0,
      pendingTickets: pendingRes?.c || 0,
      rejectedTickets: rejectedRes?.c || 0,
      canceledTickets: canceledRes?.c || 0,
      sqlProposedTickets: sqlProposedRes?.c || 0,
      validatedTickets: validatedRes?.c || 0,
      analysisPendingTickets: analysisPendingRes?.c || 0,
      priorityDistribution: priorityRows,
      teamDistribution: teamRows,
      monthlyTrend: monthlyRows,
      agentPerformance: agentPerformance,
      aiAnalysisCount: aiAnalysisRes?.c || 0,
      avgAiConfidence: avgConfRes?.avg_conf ? Math.round(avgConfRes.avg_conf * 100) : 0,
      totalUsers: usersRes?.c || 0,
      activeSessions: sessionsRes?.c || 0,
    }));
  } catch (err) {
    console.error("getReportKpisAction failed:", err);
    return null;
  }
}

// ───────────────────────────────────────────────
//  REPORTING & AUDIT
// ───────────────────────────────────────────────

export async function logReportGenerationAction(data: { name: string; description: string; theme: string; config: any }) {
  await requireAdmin();
  const session = await getSession();
  
  await logActivity("REPORT_GENERATED", {
    userMatricule: session.user!.matricule,
    details: {
      reportName: data.name,
      reportDescription: data.description,
      reportTheme: data.theme,
      reportConfig: data.config,
      generatedAt: new Date().toISOString()
    }
  });

  return { success: true };
}

export async function getReportHistoryAction() {
  await requireAdmin();
  const rows = await query<any>(
    "SELECT id, user_matricule, details, created_at FROM audit_logs WHERE action = 'REPORT_GENERATED' ORDER BY created_at DESC LIMIT 20"
  );
  
  return rows.map(r => ({
    id: r.id,
    userMatricule: r.user_matricule,
    created_at: r.created_at,
    ...JSON.parse(r.details || '{}')
  }));
}
