import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const tables = await query("SHOW TABLES");
        const tableNames = tables.map((t: any) => Object.values(t)[0]);
        
        const schema: Record<string, any> = {};
        for (const tableName of tableNames) {
            const columns = await query(`SHOW COLUMNS FROM \`${tableName}\``);
            schema[tableName as string] = columns;
        }
        
        return NextResponse.json({ success: true, schema });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
