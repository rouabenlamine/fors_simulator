const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');

try {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] || '';
    }
  });
} catch (e) {
  console.log('No .env.local found');
}

async function runReset() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
  });

  try {
    console.log("Cleaning up old corrupted accounts...");
    await pool.query("DELETE FROM users WHERE role IN ('admin', 'superadmin') OR matricule IN ('ADMIN01', 'SUPER01')");

    console.log("Upgrading database password column to fit full encryption hashes...");
    await pool.query("ALTER TABLE users MODIFY password VARCHAR(255)");

    console.log("Generating fresh BCrypt Hashes...");
    const adminHash = await bcrypt.hash('FORS_admin_2026', 10);
    const superadminHash = await bcrypt.hash('FORS_global_2026', 10);

    console.log("Creating strict new records...");
    await pool.query(
      `INSERT INTO users (matricule, username, name, prenom, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`, 
      ['ADMIN_X1', 'admin_x1', 'Regional', 'Admin', 'admin@example.com', adminHash, 'admin']
    );
    
    await pool.query(
      `INSERT INTO users (matricule, username, name, prenom, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`, 
      ['SUPER_X1', 'super_x1', 'Global', 'Superadmin', 'super@example.com', superadminHash, 'superadmin']
    );

    console.log("\n✅ Database Link Complete! Safe to Login.");
    console.log("----------------------------");
    console.log("🔥 NEW ADMIN");
    console.log("Operator ID: ADMIN_X1");
    console.log("Passphrase : FORS_admin_2026");
    console.log("----------------------------");
    console.log("🔥 NEW SUPERADMIN");
    console.log("Operator ID: SUPER_X1");
    console.log("Passphrase : FORS_global_2026");
    console.log("----------------------------");

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runReset();
