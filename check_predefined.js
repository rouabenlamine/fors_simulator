const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fors_simulator'
  });

  const [rows] = await conn.query('SELECT * FROM predefined_queries');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

check().catch(console.error);
