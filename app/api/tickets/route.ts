import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    console.log('Incoming request to /api/tickets');
    try {
        const body = await request.json();
        console.log('Request body:', JSON.stringify(body, null, 2));
        const {
            incident_number,
            opened_at,
            closed_at,
            caller,
            urgency,
            state,
            short_description,
            description,
            assignment_group,
            assigned_to,
            sys_class_name
        } = body;

        if (!incident_number) {
            return NextResponse.json({ error: 'incident_number is required' }, { status: 400 });
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const q = `
            INSERT INTO tickets (
                number, 
                short_description, 
                description, 
                state, 
                priority, 
                assignment_group, 
                assigned_to, 
                sys_created_on, 
                sys_updated_on, 
                opened_by, 
                opened_at,
                closed_at,
                sys_class_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                short_description = VALUES(short_description),
                description = VALUES(description),
                state = VALUES(state),
                priority = VALUES(priority),
                sys_updated_on = VALUES(sys_updated_on),
                closed_at = VALUES(closed_at)
        `;

        const values = [
            incident_number,
            short_description || 'No Title',
            description || '',
            state || 'New',
            urgency || '3 - Moderate',
            assignment_group || 'IT Support',
            assigned_to || null,
            now,
            now,
            caller || 'System',
            opened_at || now,
            closed_at || null,
            sys_class_name || 'incident'
        ];

        await query(q, values);

        return NextResponse.json({ 
            success: true, 
            message: `Ticket ${incident_number} saved successfully` 
        });

    } catch (error: any) {
        console.error('Error in /api/tickets:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
