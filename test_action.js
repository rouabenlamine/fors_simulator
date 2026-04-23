const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'fors_simulator',
  });

  try {
    const q = `
      INSERT INTO tickets (
        number, 
        short_description, 
        description, 
        state, 
        priority, 
        assignment_group, 
        assigned_to, 
        sys_created_on, 
        sys_updated_on, 
        opened_by, 
        opened_at, 
        sys_class_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        short_description = VALUES(short_description),
        description = VALUES(description),
        state = VALUES(state),
        sys_updated_on = VALUES(sys_updated_on)
    `;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const values = [
      'INC0011111',
      'Test title',
      'Test desc',
      'pending',
      '3 - Moderate',
      'IT Support',
      null,
      now,
      now,
      'Manual Entry',
      now,
      'incident'
    ];
    await pool.execute(q, values);
    console.log("tickets insert success");

    const q2 = `
      INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)
    `;
    await pool.execute(q2, ["SYSTEM", "CREATE_TICKET", "Created ticket INC0011111"]);
    console.log("audit_logs insert success");

    const q3 = `
      INSERT INTO ai_analysis (incident_number, root_cause, resolution_steps, suggested_sql, confidence_score)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        root_cause = VALUES(root_cause),
        resolution_steps = VALUES(resolution_steps),
        suggested_sql = VALUES(suggested_sql),
        confidence_score = VALUES(confidence_score)
    `;
    await pool.execute(q3, ["INC0011111", "root", "res", "sql", 0.85]);
    console.log("ai_analysis insert success");

  } catch(e) {
    console.error("DB ERROR:", e);
  } finally {
    await pool.end();
  }
}
test();
