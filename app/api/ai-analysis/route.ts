import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export async function POST(request: Request) {
    console.log('Incoming request to /api/ai-analysis');
    try {
        const body = await request.json();
        const {
            incident_number,
            incident_description,
            root_cause,
            resolution_steps,
            suggested_sql,
            confidence_score,
            impacted_tables
        } = body;

        if (!incident_number) {
            return NextResponse.json({ error: 'incident_number is required' }, { status: 400 });
        }

        // Save to ai_analysis table
        await execute(`
            INSERT INTO ai_analysis (
                incident_number, 
                incident_description, 
                root_cause, 
                resolution_steps, 
                suggested_sql, 
                confidence_score,
                impacted_tables
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                incident_description = VALUES(incident_description),
                root_cause = VALUES(root_cause),
                resolution_steps = VALUES(resolution_steps),
                suggested_sql = VALUES(suggested_sql),
                confidence_score = VALUES(confidence_score)
                impacted_tables = VALUES(impacted_tables)
        `, [
            incident_number,
            incident_description || '',
            root_cause || '',
            JSON.stringify(resolution_steps || []),
            suggested_sql || '',
            confidence_score !== undefined ? confidence_score : 0,
            JSON.stringify(impacted_tables || [])
        ]);

        // Also update the ticket status to 'Analysis Pending' to show it in the dashboard
        await query("UPDATE tickets SET state = 'Analysis Pending' WHERE number = ?", [incident_number]);

        return NextResponse.json({
            success: true,
            message: `AI Analysis for ${incident_number} saved successfully`
        });

    } catch (error: any) {
        console.error('Error in /api/ai-analysis:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
