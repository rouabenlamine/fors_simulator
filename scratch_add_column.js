const { execute } = require('./lib/db');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
  });

  try {
    await connection.execute(`ALTER TABLE ai_analysis ADD COLUMN impacted_tables TEXT;`);
    console.log("Column impacted_tables added successfully");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists");
    } else {
      console.error("Error:", err);
    }
  } finally {
    await connection.end();
  }
}

run();
