const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'fors_simulator'
    });
    try {
        await conn.query("DELETE FROM users WHERE matricule = 'SUP001'");
        await conn.query(`
            INSERT INTO users (matricule, name, prenom, username, email, role, password, is_active) 
            VALUES ('SUP001', 'Support', 'Agent', 'support_agent', 'support@test.com', 'it_support', 'fors2025', 1)
        `);
        console.log("Added it_support user: SUP001 / fors2025");
    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}
main();
