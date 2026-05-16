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
        // 1. impacted_tables & agent_summary columns
        try {
            await pool.query("ALTER TABLE ai_analysis ADD COLUMN impacted_tables TEXT");
        } catch (err: any) {
            if (err.code !== "ER_DUP_FIELDNAME") { /* ignore */ }
        }
        try {
            await pool.query("ALTER TABLE ai_analysis ADD COLUMN agent_summary TEXT");
        } catch (err: any) {
            if (err.code !== "ER_DUP_FIELDNAME") { /* ignore */ }
        }
        try {
            await pool.query("ALTER TABLE ai_analysis ADD COLUMN confidence_score DOUBLE DEFAULT 0");
        } catch (err: any) {
            if (err.code !== "ER_DUP_FIELDNAME") { /* ignore */ }
        }
        console.log("[DB] Successfully verified impacted_tables, agent_summary & confidence_score columns in ai_analysis");

        // 1b. assigned_support_matricule — stores the FORS matricule of the IT support
        //     user responsible for this ticket (mapped from ServiceNow assigned_to).
        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN assigned_support_matricule VARCHAR(50) NULL DEFAULT NULL");
            console.log("[DB] Successfully added assigned_support_matricule column to tickets");
        } catch (err: any) {
            if (err.code !== "ER_DUP_FIELDNAME") { /* ignore */ }
        }

        // 1b-fix. Drop any foreign key constraint on assigned_support_matricule.
        // A FK here causes the ENTIRE ticket INSERT to crash if the matricule
        // doesn't exist in the users table — we handle validation in application code instead.
        try {
            const [fks] = await pool.query(`
                SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'tickets'
                  AND COLUMN_NAME = 'assigned_support_matricule'
                  AND REFERENCED_TABLE_NAME IS NOT NULL
            `);
            for (const fk of (fks as any[])) {
                await pool.query(`ALTER TABLE tickets DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                console.log(`[DB] Dropped FK constraint "${fk.CONSTRAINT_NAME}" on assigned_support_matricule`);
            }
        } catch (err: any) {
            // Ignore — no FK to drop
        }

        // 1c. urgency and watch_list from new n8n payload
        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN urgency VARCHAR(50) NULL DEFAULT NULL");
        } catch (err: any) {
            if (err.code !== "ER_DUP_FIELDNAME") { /* ignore */ }
        }
        try {
            await pool.query("ALTER TABLE tickets ADD COLUMN watch_list TEXT NULL DEFAULT NULL");
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
