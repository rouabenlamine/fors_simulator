const fs = require('fs');
const mysql = require('mysql2/promise');

async function checkDb() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fors_simulator'
  });

  const [tables] = await conn.query('SHOW TABLES');
  const schema = {};

  for (let row of tables) {
    const tableName = Object.values(row)[0];
    const [columns] = await conn.query(`SHOW COLUMNS FROM ${tableName}`);
    schema[tableName] = columns.map(c => ({ Field: c.Field, Type: c.Type }));
  }

  fs.writeFileSync('schema_output.json', JSON.stringify(schema, null, 2));
  process.exit(0);
}

checkDb().catch(console.error);
