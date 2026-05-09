const mysql = require('mysql2/promise');
const fs = require('fs');

try {
  const envConfig = fs.readFileSync('.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      process.env[match[1]] = match[2] || '';
    }
  });
} catch (e) {
  console.log('No .env.local found');
}

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
  });

  try {
    console.log('Renaming column prenom -> surname in users table...');
    await pool.query('ALTER TABLE users CHANGE prenom surname VARCHAR(255)');
    console.log('✅ Column renamed successfully: prenom -> surname');
  } catch (err) {
    if (err.message.includes("Unknown column")) {
      console.log('Column "prenom" does not exist — it may already have been renamed.');
    } else {
      console.error('Migration failed:', err.message);
    }
  } finally {
    await pool.end();
  }
}

run();
