const mysql = require('mysql2/promise');

async function dumpUsers() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fors_simulator'
  });

  const [rows] = await conn.query('SELECT matricule, role, name FROM users');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

dumpUsers().catch(console.error);
