import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { logActivity } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

// ─── ServiceNow numeric → label mappings ─────────────────────────────────────

const STATE_MAP: Record<string, string> = {
    '1': 'New',
    '2': 'In Progress',
    '3': 'On Hold',
    '6': 'Resolved',
    '7': 'Closed',
    '8': 'Canceled',
};

const PRIORITY_MAP: Record<string, string> = {
    '1': '1 - Critical',
    '2': '2 - High',
    '3': '3 - Moderate',
    '4': '4 - Low',
    '5': '5 - Planning',
};

/** Resolve a numeric code → label. If already a word label, return as-is. */
function resolve(value: string | undefined | null, map: Record<string, string>, fallback: string): string {
    if (!value) return fallback;
    const str = String(value).trim();
    if (!/^\d+$/.test(str)) return str;      // already a word label
    return map[str] ?? fallback;
}

/** Pick the first truthy value from a list of candidates. */
function pick(...candidates: (string | undefined | null)[]): string {
    for (const v of candidates) {
        const s = (v ?? '').toString().trim();
        if (s && s !== 'null' && s !== 'undefined') return s;
    }
    return '';
}

// ─── POST /api/tickets ────────────────────────────────────────────────────────

export async function POST(request: Request) {
    console.log('[/api/tickets] Incoming request');
    try {
        const raw = await request.json();

        // TEMPORARY: Dump payload to inspect structure
        try {
            const dumpPath = path.join(process.cwd(), 'scratch', 'last_n8n_payload.json');
            fs.writeFileSync(dumpPath, JSON.stringify(raw, null, 2));
        } catch (e) {
            console.error('Failed to write payload dump', e);
        }

        // n8n sometimes wraps the ServiceNow record in a nested key.
        // Try to unwrap: { result: {...} }, { data: {...} }, { body: {...} }, etc.
        let body: Record<string, any> =
            raw?.result ?? raw?.data ?? raw?.body ?? raw?.record ?? raw;

        // CRITICAL FIX: The n8n payload was sending keys with trailing spaces
        // e.g., "short_description " instead of "short_description".
        // Normalize the payload by trimming all whitespace from the keys.
        const normalizedBody: Record<string, any> = {};
        if (body && typeof body === 'object') {
            for (const key of Object.keys(body)) {
                normalizedBody[key.trim()] = body[key];
            }
        }
        body = normalizedBody;

        console.log('[/api/tickets] Normalized body keys:', Object.keys(body));

        // ── Ticket number ─────────────────────────────────────────────────────
        const incident_number = pick(
            body.incident_number,
            body.number,
            body.sys_id,
            body.id,
        );

        if (!incident_number) {
            return NextResponse.json({ error: 'incident_number / number is required' }, { status: 400 });
        }

        // ── Short description (title) ─────────────────────────────────────────
        // n8n / ServiceNow may use any of these keys:
        const shortDesc = pick(
            body.short_description,
            body.shortDescription,
            body.title,
            body.name,
            body.summary,
            body.subject,
            body.internal_description,
        );

        // ── Long description ──────────────────────────────────────────────────
        const longDesc = pick(
            body.description,
            body.long_description,
            body.longDescription,
            body.details,
            body.body,
            body.internal_description,
            body.work_notes,
        );

        // ── Other fields ──────────────────────────────────────────────────────
        const state            = pick(body.state, body.status, body.incident_state);
        const priority         = pick(body.analysis_priority, body.priority, body.impact);
        const assignment_group = pick(body.assignment_group, body.group, body.team);
        const assigned_to      = pick(body.assigned_to, body.assignee, body.agent);
        const assigned_to_user_id = pick(body.assigned_to_user_id); // Direct matricule
        const caller           = pick(body.caller, body.caller_id, body.opened_by, body.reporter, body.user, body.requester);
        const sys_class_name   = pick(body.sys_class_name, body.type, body.category) || 'incident';
        const opened_at        = body.opened_at || body.created_at || body.sys_created_on || null;
        const closed_at        = body.closed_at || body.resolved_at || null;
        const urgency          = pick(body.urgency);
        const watch_list       = pick(body.watch_list);
        const comments         = pick(body.comments);

        // ── Resolve numeric codes → human-readable labels ─────────────────────
        const finalState    = resolve(state, STATE_MAP, 'New');
        const finalPriority = resolve(priority, PRIORITY_MAP, '3 - Moderate');
        const finalShortDesc = shortDesc || 'No Title';
        const finalLongDesc  = longDesc  || '';

        console.log(`[/api/tickets] Resolved → number="${incident_number}" | title="${finalShortDesc}" | state="${finalState}" | priority="${finalPriority}"`);

        // ── Verify matricule exists to prevent Foreign Key crashes ────────────
        let validated_matricule = null;
        if (assigned_to_user_id) {
            try {
                const userCheck = await query<any>("SELECT matricule FROM users WHERE matricule = ?", [assigned_to_user_id.trim()]);
                if (userCheck.length > 0) {
                    validated_matricule = userCheck[0].matricule;
                } else {
                    console.log(`[/api/tickets] WARNING: assigned_to_user_id "${assigned_to_user_id}" does NOT exist in the users table. Ignoring to prevent FK constraint failure.`);
                }
            } catch (err) {
                console.error("[/api/tickets] Error verifying matricule:", err);
            }
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
                assigned_support_matricule,
                sys_created_on,
                sys_updated_on,
                opened_by,
                opened_at,
                closed_at,
                sys_class_name,
                urgency,
                watch_list,
                comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                short_description = CASE
                    WHEN VALUES(short_description) != '' AND VALUES(short_description) != 'No Title'
                    THEN VALUES(short_description)
                    ELSE short_description
                END,
                description = CASE
                    WHEN VALUES(description) != ''
                    THEN VALUES(description)
                    ELSE description
                END,
                state          = VALUES(state),
                priority       = VALUES(priority),
                sys_updated_on = VALUES(sys_updated_on),
                closed_at      = VALUES(closed_at),
                urgency        = VALUES(urgency),
                watch_list     = VALUES(watch_list),
                assigned_to    = CASE
                    WHEN VALUES(assigned_to) IS NOT NULL AND VALUES(assigned_to) != ''
                    THEN VALUES(assigned_to)
                    ELSE assigned_to
                END,
                comments       = CASE
                    WHEN VALUES(comments) != '' THEN VALUES(comments)
                    ELSE comments
                END,
                assigned_support_matricule = CASE 
                    WHEN VALUES(assigned_support_matricule) IS NOT NULL THEN VALUES(assigned_support_matricule)
                    ELSE assigned_support_matricule
                END
        `;

        const values = [
            incident_number,
            finalShortDesc,
            finalLongDesc,
            finalState,
            finalPriority,
            assignment_group || 'IT Support',
            assigned_to      || null,
            validated_matricule, // Use the DB-validated matricule!
            now,
            now,
            caller           || 'System',
            opened_at        || now,
            closed_at        || null,
            sys_class_name,
            urgency          || null,
            watch_list       || null,
            comments         || null,
        ];

        await query(q, values);

        // ── Resolve assigned_to → FORS support user matricule ─────────────────
        // Fallback: If we didn't get assigned_to_user_id from n8n directly, try to
        // find a matching it_support user using assigned_to (in case old payload is sent).
        if (!assigned_to_user_id && assigned_to) {
            try {
                const supportUsers = await query<any>(
                    "SELECT matricule FROM users WHERE matricule = ? AND role = 'it_support' LIMIT 1",
                    [assigned_to.trim()]
                );
                if (supportUsers.length > 0) {
                    await query(
                        "UPDATE tickets SET assigned_support_matricule = ? WHERE number = ?",
                        [supportUsers[0].matricule, incident_number]
                    );
                    console.log(`[/api/tickets] Mapped assigned_to="${assigned_to}" → FORS matricule="${supportUsers[0].matricule}"`);
                } else {
                    console.log(`[/api/tickets] No FORS it_support user found for assigned_to="${assigned_to}"`);
                }
            } catch (mapErr: any) {
                console.error("[/api/tickets] Failed to map assigned_support_matricule:", mapErr.message);
            }
        }

        // Log n8n insertion for notification center
        await logActivity("INCOMING_N8N_TICKET", {
            ticketId: incident_number,
            details: { message: `Incoming ticket imported and queued for analysis from n8n`, source: "n8n" }
        });

        return NextResponse.json({
            success: true,
            message: `Ticket ${incident_number} saved`,
            resolved: { incident_number, finalShortDesc, finalState, finalPriority }
        });

    } catch (error: any) {
        console.error('[/api/tickets] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}