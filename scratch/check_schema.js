const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'fors_simulator' });
  const [rows] = await pool.query("SHOW CREATE TABLE ai_analysis");
  console.log(JSON.stringify(rows[0], null, 2));
  pool.end();
}
test();
