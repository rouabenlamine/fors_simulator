const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'fors_simulator'
    });
    const [rows] = await conn.query("SELECT matricule, role, password FROM users WHERE role = 'it_support'");
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
}
main();
