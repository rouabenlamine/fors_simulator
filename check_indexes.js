const mysql = require('mysql2/promise');

async function checkIndexes() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'fors_simulator',
  });

  try {
    const [rows] = await pool.execute("SHOW INDEX FROM ai_analysis");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkIndexes();
