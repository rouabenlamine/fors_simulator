import "server-only";
import mysql from 'mysql2/promise';

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

// Auto-migrate to ensure impacted_tables column exists
(async () => {
    try {
        await pool.query("ALTER TABLE ai_analysis ADD COLUMN impacted_tables TEXT");
        console.log("[DB] Successfully added impacted_tables column to ai_analysis");
    } catch (err: any) {
        if (err.code !== "ER_DUP_FIELDNAME") {
            // It's fine if it already exists
        }
    }
})();
