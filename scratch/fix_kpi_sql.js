const mysql = require('mysql2/promise');
// require('dotenv').config();

async function fixKpi() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
  });

  try {
    console.log('Checking unique states...');
    const [states] = await connection.execute('SELECT DISTINCT state FROM tickets');
    console.log('States found:', states.map(s => s.state));

    console.log('Fixing KPI: Validated AI Resolutions...');
    const query = "SELECT COUNT(*) as count FROM tickets WHERE state = 'Validated' AND number IN (SELECT incident_number FROM ai_analysis)";
    const [result] = await connection.execute(
      "UPDATE kpi_configs SET sql_query = ? WHERE name = 'Validated AI Resolutions'",
      [query]
    );
    console.log('Update result:', result);
    
    // Also fix any other potentially broken ones or just check them
    const [rows] = await connection.execute("SELECT name, sql_query FROM kpi_configs");
    console.log('Current KPIs:');
    rows.forEach(r => console.log(`- ${r.name}: ${r.sql_query}`));

  } catch (err) {
    console.error('Error fixing KPI:', err);
  } finally {
    await connection.end();
  }
}

fixKpi();
