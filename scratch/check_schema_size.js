const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fors_simulator'
  });
  const [tables] = await conn.query("SELECT name, description FROM database_tables LIMIT 40");
  const schema = tables.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n');
  console.log("Schema Length:", schema.length);
  console.log("Schema Preview:\n", schema.substring(0, 500));
  process.exit(0);
}
test().catch(console.error);
