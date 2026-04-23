import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

async function main() {
    try {
        const hashReport = bcrypt.hashSync('report2025', 10);
        const hashManager = bcrypt.hashSync('manager2025', 10);
        
        await pool.execute(
            `INSERT INTO users (matricule, name, prenom, username, email, password, role, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
            ['REP01', 'Test', 'Reporter', 'treporter', 'reporter@test.com', hashReport, 'it_report']
        );
        
        await pool.execute(
            `INSERT INTO users (matricule, name, prenom, username, email, password, role, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
            ['MGR01', 'Test', 'Manager', 'tmanager', 'manager@test.com', hashManager, 'it_manager']
        );
        
        console.log("Users created successfully");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
