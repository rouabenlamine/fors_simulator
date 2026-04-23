const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'fors_simulator' });
  const [rows] = await pool.query("SHOW CREATE TABLE audit_logs");
  const ddl = rows[0]['Create Table'];
  const fs = require('fs');
  fs.writeFileSync('schema_audit.txt', ddl, 'utf8');
  pool.end();
}
test();
