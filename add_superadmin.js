const mysql = require('mysql2/promise');
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

async function createCoreAdmins() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
  });

  try {
    const bcrypt = require('bcryptjs');
    console.log('Generating seed passwords...');
    const adminHash = await bcrypt.hash('admin2025', 10);
    const superadminHash = await bcrypt.hash('super2025', 10);

    // Create Admin
    await pool.query(`
      INSERT INTO users (matricule, name, prenom, email, password, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)
    `, ['ADMIN01', 'System', 'Admin', 'admin@example.com', adminHash, 'admin']);

    // Create Superadmin
    await pool.query(`
      INSERT INTO users (matricule, name, prenom, email, password, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)
    `, ['SUPER01', 'Global', 'Superadmin', 'super@example.com', superadminHash, 'superadmin']);

    console.log('✅ Accounts created/updated successfully!');
    console.log('');
    console.log('--- ADMIN LOGIN ---');
    console.log('Matricule: ADMIN01');
    console.log('Password : admin2025');
    console.log('');
    console.log('--- SUPERADMIN LOGIN ---');
    console.log('Matricule: SUPER01');
    console.log('Password : super2025');
    console.log('-------------------');

  } catch (err) {
    console.error('Failed to create users:', err);
  } finally {
    await pool.end();
  }
}

createCoreAdmins();
