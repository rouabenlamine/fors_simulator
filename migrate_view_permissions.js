/**
 * Run with: node migrate_view_permissions.js
 * Creates the view_permissions table for FORS View Control module.
 */
const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

const ROLES = ["it_support", "it_manager", "it_report", "admin"];

const DEFAULT_COMPONENTS = [
  "notification_button",
  "chat_bubble",
  "kpi_widgets",
  "sql_console",
  "activity_logs",
  "report_export",
  "incident_analysis",
  "tickets_list",
  "analysis_workspace",
  "analysis_lab",
  "fors_explorer",
  "user_management",
  "kpi_config",
];

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "fors_simulator",
  });

  // Create table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS view_permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role VARCHAR(50) NOT NULL UNIQUE,
      permissions JSON NOT NULL,
      updated_by VARCHAR(100) DEFAULT 'SYSTEM',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Table view_permissions ready");

  // Seed default permissions (all ON by default)
  for (const role of ROLES) {
    const perms = {};
    for (const c of DEFAULT_COMPONENTS) {
      perms[c] = true;
    }

    await pool.execute(
      `INSERT INTO view_permissions (role, permissions) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE permissions = VALUES(permissions)`,
      [role, JSON.stringify(perms)]
    );
    console.log(`  ✅ Seeded permissions for role: ${role}`);
  }

  console.log("\n✅ Migration complete.");
  await pool.end();
}

run().catch((e) => {
  console.error("❌ Migration failed:", e.message);
  process.exit(1);
});
