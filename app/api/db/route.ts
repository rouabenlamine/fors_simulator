import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const [rows2] = await query("SHOW CREATE TABLE ai_analysis");
        const schema2 = (rows2 as Record<string, string>)['Create Table'];

        return NextResponse.json({ ai_analysis: schema2 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
