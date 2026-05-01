import "server-only";
import mysql from 'mysql2/promise';

const poolConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fors_simulator',
    waitForConnections: true,
    connectionLimit: 20, // Increased for better concurrency
    queueLimit: 0,
};

// Singleton pattern for Next.js HMR
const globalForDb = global as unknown as { pool: mysql.Pool };
const pool = globalForDb.pool || mysql.createPool(poolConfig);

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
}

export async function execute(sql: string, params?: any[]): Promise<any> {
    const [result] = await pool.execute(sql, params);
    return result;
}

/**
 * Run multiple queries inside a single database transaction.
 * If the callback throws, the transaction is rolled back automatically.
 */
export async function transaction<T>(
    callback: (conn: {
        query: <R>(sql: string, params?: any[]) => Promise<R[]>;
        execute: (sql: string, params?: any[]) => Promise<any>;
    }) => Promise<T>
): Promise<T> {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
        const result = await callback({
            query: async <R>(sql: string, params?: any[]): Promise<R[]> => {
                const [rows] = await conn.execute(sql, params);
                return rows as R[];
            },
            execute: async (sql: string, params?: any[]): Promise<any> => {
                const [res] = await conn.execute(sql, params);
                return res;
            },
        });
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

/** Generate a unique ID string (e.g. "ANALYSIS-a3f8b2c1") */
export function generateId(prefix: string = "ANALYSIS"): string {
    const hex = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    return `${prefix}-${hex}`;
}

export default pool;

// Auto-migrate to ensure necessary tables exist
(async () => {
    try {
        // 1. impacted_tables column
        try {
            await pool.query("ALTER TABLE ai_analysis ADD COLUMN impacted_tables TEXT");
            console.log("[DB] Successfully added impacted_tables column to ai_analysis");
        } catch (err: any) {
            if (err.code !== "ER_DUP_FIELDNAME") { /* ignore */ }
        }

        // 2. Audit Logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_matricule VARCHAR(50),
                action VARCHAR(100),
                details LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Transactions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                pgmType VARCHAR(100),
                language VARCHAR(100),
                sqlPg TEXT,
                tables TEXT,
                pgms TEXT,
                createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            )
        `);

        // 4. Menus
        await pool.query(`
            CREATE TABLE IF NOT EXISTS menus (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                parentId VARCHAR(50),
                icon VARCHAR(100),
                path VARCHAR(255),
                \`order\` INT DEFAULT 0,
                createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            )
        `);

        // 5. Database Tables Metadata
        await pool.query(`
            CREATE TABLE IF NOT EXISTS database_tables (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                path VARCHAR(255),
                \`schema\` TEXT,
                createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
                updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
            )
        `);

        console.log("[DB] Schema initialization check complete.");
    } catch (err) {
        console.error("[DB] Critical initialization error:", err);
    }
})();
