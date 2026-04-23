const mysql = require('mysql2/promise');
async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'fors_simulator'
    });
    const [rows] = await conn.query("SELECT name FROM database_tables");
    console.log("REAL_TABLES_START");
    console.log(JSON.stringify(rows));
    console.log("REAL_TABLES_END");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
