/**
 * Migration: Admin Modules
 * - Alters users.role enum to include 'superadmin'
 * - Creates system_configurations table for integration settings
 */
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'fors_simulator',
  });

  try {
    console.log("=== FORS Admin Modules Migration ===\n");

    // 1. Alter users.role enum to include superadmin
    console.log("[1/2] Altering users.role enum to include 'superadmin'...");
    try {
      await pool.query(`
        ALTER TABLE users
        MODIFY COLUMN role ENUM('user','it_support','admin','superadmin') NOT NULL DEFAULT 'user'
      `);
      console.log("  ✅ users.role enum updated.\n");
    } catch (e) {
      if (e.message.includes("Duplicate")) {
        console.log("  ⚠️  Already modified, skipping.\n");
      } else {
        console.log("  ⚠️  " + e.message + "\n");
      }
    }

    // 2. Create system_configurations table
    console.log("[2/2] Creating system_configurations table...");
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_configurations (
          id VARCHAR(100) PRIMARY KEY,
          category VARCHAR(100) NOT NULL,
          config_key VARCHAR(255) NOT NULL,
          config_value TEXT,
          updated_by VARCHAR(50),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_cat_key (category, config_key)
        )
      `);
      console.log("  ✅ system_configurations table created.\n");
    } catch (e) {
      console.log("  ⚠️  " + e.message + "\n");
    }

    // 3. Seed default integration configs
    console.log("[Seed] Adding default integration configurations...");
    const defaults = [
      ['servicenow_instance_url', 'servicenow', 'instance_url', ''],
      ['servicenow_client_id', 'servicenow', 'client_id', ''],
      ['servicenow_client_secret', 'servicenow', 'client_secret', ''],
      ['n8n_webhook_url', 'n8n', 'webhook_url', 'http://localhost:5678'],
      ['n8n_fallback_url', 'n8n', 'fallback_url', ''],
      ['ai_provider', 'ai', 'provider', 'ollama'],
      ['ai_model', 'ai', 'model', 'qwen3.5:4b'],
      ['ai_endpoint', 'ai', 'endpoint', 'http://localhost:11434'],
      ['ai_temperature', 'ai', 'temperature', '0.7'],
    ];

    for (const [id, cat, key, val] of defaults) {
      try {
        await pool.query(`
          INSERT IGNORE INTO system_configurations (id, category, config_key, config_value)
          VALUES (?, ?, ?, ?)
        `, [id, cat, key, val]);
      } catch (e) { /* skip duplicates */ }
    }
    console.log("  ✅ Default configurations seeded.\n");

    console.log("=== Migration complete ===");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

main();
