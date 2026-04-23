const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'actions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// ─── Patch 1: Remove analysis_id from validated_incidents INSERT ──────────────
// Replace the INSERT into validated_incidents 
const OLD_INSERT = `      // 2a. Insert validated incident with analysis_id FK
      await conn.execute(\`
        INSERT INTO validated_incidents (incident_number, validated_by, incident_description, target_table, final_solution, analysis_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          validated_by = VALUES(validated_by),
          incident_description = VALUES(incident_description),
          final_solution = VALUES(final_solution),
          analysis_id = VALUES(analysis_id)
      \`, [
        ticketId,
        userMatricule,
        ticket.description || '',
        '', // target_table \u2013 populated if known
        resolutionSteps,
        analysisId
      ]);`;

const NEW_INSERT = `      // 2a. Insert into validated_incidents (only columns that exist in the schema)
      // Build rich close_notes = full analysis snapshot for later retrieval
      const rootCauseForNotes = (currentAnalysis?.rootCause) || (analysis?.root_cause) || 'Manual/Predefined Validation';
      const suggestedSqlForNotes = (currentAnalysis?.sqlProposal) || (analysis?.suggested_sql) || '';
      const confidenceForNotes = analysis?.confidence_score ?? 1.0;
      let parsedResolutionForNotes: any = resolutionSteps;
      try { parsedResolutionForNotes = JSON.parse(resolutionSteps as string); } catch {}
      const closeNoteLines = [
        \`=== AI Analysis Report ===\`,
        \`Validated by: \${userMatricule}\`,
        \`Confidence: \${Math.round(Number(confidenceForNotes) * 100)}%\`,
        \`\`,
        \`--- Root Cause ---\`,
        rootCauseForNotes,
        \`\`,
        \`--- Resolution Steps ---\`,
        typeof parsedResolutionForNotes === 'string' ? parsedResolutionForNotes : JSON.stringify(parsedResolutionForNotes, null, 2),
      ];
      if (suggestedSqlForNotes && suggestedSqlForNotes.trim()) {
        closeNoteLines.push(\`\`, \`--- Suggested SQL ---\`, suggestedSqlForNotes);
      }
      const closeNotes = closeNoteLines.join('\\n');

      await conn.execute(\`
        INSERT INTO validated_incidents (incident_number, validated_by, incident_description, target_table, final_solution)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          validated_by         = VALUES(validated_by),
          incident_description = VALUES(incident_description),
          final_solution       = VALUES(final_solution)
      \`, [
        ticketId,
        userMatricule,
        ticket.description || '',
        '',           // target_table
        closeNotes    // full analysis snapshot
      ]);`;

// ─── Patch 2: Also persist analysis to tickets.close_notes ───────────────────
const OLD_UPDATE = `      // 2b. Update ticket state
      await conn.execute("UPDATE tickets SET state = 'Validated', comments = ? WHERE number = ?", [
        \`Solution validated by \${userMatricule}. \${analysisId ? 'Analysis ID: ' + analysisId + '.' : ''} Solution: \${resolutionSteps}\`,
        ticketId
      ]);`;

const NEW_UPDATE = `      // 2b. Update ticket – state, close_notes (full analysis), comments
      await conn.execute(
        "UPDATE tickets SET state = 'Validated', close_notes = ?, comments = ? WHERE number = ?",
        [closeNotes, \`Solution validated by \${userMatricule}.\`, ticketId]
      );`;

let patched = content;
if (patched.includes('2a. Insert validated incident with analysis_id FK')) {
  patched = patched.replace(OLD_INSERT, NEW_INSERT);
  console.log('Patch 1 applied (INSERT)');
} else {
  console.error('ERROR: Patch 1 target not found!');
  process.exit(1);
}

if (patched.includes("2b. Update ticket state")) {
  patched = patched.replace(OLD_UPDATE, NEW_UPDATE);
  console.log('Patch 2 applied (UPDATE)');
} else {
  console.error('ERROR: Patch 2 target not found!');
  process.exit(1);
}

fs.writeFileSync(filePath, patched, 'utf8');
console.log('actions.ts patched successfully.');
