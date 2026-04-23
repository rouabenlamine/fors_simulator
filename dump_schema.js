const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'fors_simulator' });
  const [rows] = await pool.query("SHOW CREATE TABLE audit_logs");
  console.log(rows[0]['Create Table']);
  pool.end();
}
test();
