import pool from '@/lib/db';
import { upsertToChroma } from '@/lib/chroma';

/**
 * Sync SQL validated incidents to ChromaDB for semantic search
 */
export async function syncIncidentsToChroma() {
  console.log('[Sync] Starting validated incidents sync to ChromaDB...');
  
  try {
    const [rows] = await pool.execute(`
      SELECT 
        a.incident_number,
        a.incident_description,
        a.final_solution,
        a.root_cause,
        a.resolution_steps
      FROM ai_analysis a
      WHERE a.final_solution IS NOT NULL
    `) as any;

    const items = (rows as any[]).map(row => ({
      id: `incident_${row.incident_number}`,
      content: `Problem: ${row.incident_description}\nRoot Cause: ${row.root_cause}\nSolution: ${row.final_solution}\nSteps: ${row.resolution_steps}`,
      metadata: {
        number: row.incident_number,
        type: 'validated_incident',
        db_id: row.incident_number
      }
    }));

    if (items.length > 0) {
      await upsertToChroma('validated_incidents', items);
      console.log(`[Sync] Successfully indexed ${items.length} incidents.`);
    } else {
      console.log('[Sync] No incidents found to index.');
    }
  } catch (err) {
    console.error('[Sync] Error syncing incidents:', err);
  }
}

/**
 * Sync predefined queries
 */
export async function syncQueriesToChroma() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, name, description, category, \`sql\`
      FROM predefined_queries
      WHERE isActive = 1
    `) as any;

    const items = (rows as any[]).map(row => ({
      id: `query_${row.id}`,
      content: `Query Name: ${row.name}\nDescription: ${row.description}\nCategory: ${row.category}\nSQL: ${row.sql}`,
      metadata: {
        type: 'predefined_query',
        category: row.category,
        db_id: row.id
      }
    }));

    if (items.length > 0) {
      await upsertToChroma('predefined_queries', items);
      console.log(`[Sync] Successfully indexed ${items.length} predefined queries.`);
    }
  } catch (err) {
    console.error('[Sync] Error syncing queries:', err);
  }
}
