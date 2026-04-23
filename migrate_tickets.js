const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'fors_simulator',
  });

  try {
    console.log("Adding analysis_id column to tickets table...");
    await pool.execute("ALTER TABLE tickets ADD COLUMN analysis_id INT(11) DEFAULT NULL");
    console.log("Success!");
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Column analysis_id already exists.");
    } else {
      console.error("Migration failed:", err);
    }
  } finally {
    await pool.end();
  }
}

migrate();
