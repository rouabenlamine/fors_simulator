const mysql = require('mysql2/promise');

async function getAllSchemas() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'fors_simulator' });
  try {
    const [tables] = await pool.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    for (const tableName of tableNames) {
      const [rows] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      console.log(`\n--- TABLE: ${tableName} ---`);
      console.log(rows[0]['Create Table'] || rows[0]['Create View']);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

getAllSchemas();
