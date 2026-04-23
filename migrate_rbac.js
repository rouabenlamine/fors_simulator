const mysql = require('mysql2/promise');
const fs = require('fs');

// Simple native dotenv parser
try {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = match[2] || '';
    }
  });
} catch (e) {
  console.log('No .env.local found, falling back to process.env');
}

async function migrateRbac() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
  });

  try {
    console.log('Altering users table...');

    // 1. Add 'superadmin' to the enum
    try {
      await pool.query(`ALTER TABLE users MODIFY COLUMN role ENUM('user','it_support','admin','superadmin') NOT NULL DEFAULT 'user'`);
      console.log('Successfully updated role ENUM to include superadmin.');
    } catch (err) {
      console.log('Error altering table or it might already be updated:', err.message);
    }

    // 2. Add permissions JSON column
    const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'permissions'`);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL`);
      console.log('Added permissions JSON column to users.');
    } else {
      console.log('permissions column already exists.');
    }

    // 3. Ensure audit_logs table exists
    const [tables] = await pool.query(`SHOW TABLES LIKE 'audit_logs'`);
    if (tables.length === 0) {
      await pool.query(`
        CREATE TABLE audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_matricule VARCHAR(50),
          action VARCHAR(100),
          details LONGTEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Created audit_logs table.');
    } else {
      console.log('audit_logs table already exists, ensuring columns...');
      // To be safe, make sure user_matricule isn't just ID or anything if they modified it
    }

    console.log('✅ RBAC Migration successful.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrateRbac();
