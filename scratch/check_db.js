
const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fors_simulator',
    });

    try {
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', JSON.stringify(tables));

        for (const t of tables) {
            const tableName = Object.values(t)[0];
            const [count] = await pool.query(`SELECT COUNT(*) as cnt FROM ??`, [tableName]);
            console.log(`Table ${tableName}: ${count[0].cnt} rows`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
