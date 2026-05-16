/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  FORS Simulator — Comprehensive Project Cleanup Script
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  Run with:  node cleanup_project.js
 *
 *  What this does:
 *    1. Removes all one-off migration scripts from the project root
 *    2. Removes all debug/inspection scripts from the project root
 *    3. Removes stale data dump files (JSON, SQL, TXT, log)
 *    4. Removes dead code files (lib/api.ts — never imported anywhere)
 *    5. Removes debug-only API endpoints (/api/db, /api/migrate, /api/temp-schema-dump)
 *    6. Removes the scratch/ directory (developer-only debug scripts)
 *    7. Removes the empty components/database/ directory
 *    8. Removes the old cleanup.js script
 *
 *  Safety guarantees:
 *    - Every file listed here was verified via import-tracing (grep) to have
 *      ZERO active references in the application codebase
 *    - The script prints a full preview before deleting anything
 *    - All actively-imported lib/ files, components, pages, and API routes
 *      are explicitly preserved
 *
 *  After running:
 *    1. Delete this cleanup_project.js file
 *    2. Run "npm run dev" to verify the app works
 *    3. Commit your changes
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY 1: One-off migration scripts (already executed, never imported)
// ─────────────────────────────────────────────────────────────────────────────
const MIGRATION_SCRIPTS = [
  'add_superadmin.js',
  'add_support_user.js',
  'backfill_assigned_support.js',
  'migrate_admin_modules.js',
  'migrate_chat_schema.js',
  'migrate_rbac.js',
  'migrate_tickets.js',
  'migrate_view_permissions.js',
  'patch_actions.js',
  'reset_admins.js',
];

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY 2: Debug / inspection scripts (never imported by the app)
// ─────────────────────────────────────────────────────────────────────────────
const DEBUG_SCRIPTS = [
  'check_db.ts',
  'check_indexes.js',
  'check_predefined.js',
  'check_users.js',
  'dump_schema.js',
  'dump_users.js',
  'print_schema.js',
  'print_schema2.js',
  'query_schema.js',
  'scratch_add_column.js',
  'test_action.js',
  'test_db_hash.js',
];

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY 3: Stale data / output files (not referenced by the app)
// ─────────────────────────────────────────────────────────────────────────────
const STALE_DATA_FILES = [
  'backup_before_migration.sql',
  'build.log',
  'dump.txt',
  'real_schema.json',
  'schema_audit.txt',
  'schema_output.json',
  'users_list.json',
];

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY 4: Dead code files (exports exist but are never imported)
// ─────────────────────────────────────────────────────────────────────────────
const DEAD_CODE_FILES = [
  'lib/api.ts',            // N8N webhook helpers — zero imports found in entire codebase
];

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY 5: Old cleanup script (being replaced by this one)
// ─────────────────────────────────────────────────────────────────────────────
const OLD_SCRIPTS = [
  'cleanup.js',
];

// ─────────────────────────────────────────────────────────────────────────────
//  CATEGORY 6: Directories to remove entirely
// ─────────────────────────────────────────────────────────────────────────────
const DIRS_TO_DELETE = [
  'scratch',                    // One-off debug scripts (add_roles, check_db, fix_kpi_sql, etc.)
  'app/api/db',                 // Debug endpoint — shows ai_analysis schema, no frontend usage
  'app/api/migrate',            // One-time migration endpoint, no frontend usage
  'app/api/temp-schema-dump',   // Debug endpoint — dumps full DB schema, no frontend usage
  'components/database',        // Empty directory — zero files inside
];

// ═══════════════════════════════════════════════════════════════════════════════
//  EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

const allFiles = [
  ...MIGRATION_SCRIPTS,
  ...DEBUG_SCRIPTS,
  ...STALE_DATA_FILES,
  ...DEAD_CODE_FILES,
  ...OLD_SCRIPTS,
];

let deletedFiles = 0;
let deletedDirs = 0;
let skippedFiles = 0;
let skippedDirs = 0;
let totalBytesFreed = 0;

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║          🧹 FORS Project — Comprehensive Cleanup            ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

// ── Phase 1: Preview ─────────────────────────────────────────────────────────
console.log('📋 PREVIEW — Files and directories that will be removed:\n');

console.log('  ┌─ Migration Scripts (' + MIGRATION_SCRIPTS.length + ' files)');
for (const f of MIGRATION_SCRIPTS) {
  const fp = path.join(ROOT, f);
  const exists = fs.existsSync(fp);
  const size = exists ? fs.statSync(fp).size : 0;
  console.log(`  │  ${exists ? '✓' : '✗'} ${f}${exists ? ` (${(size / 1024).toFixed(1)} KB)` : ' — already gone'}`);
}

console.log('  ├─ Debug Scripts (' + DEBUG_SCRIPTS.length + ' files)');
for (const f of DEBUG_SCRIPTS) {
  const fp = path.join(ROOT, f);
  const exists = fs.existsSync(fp);
  const size = exists ? fs.statSync(fp).size : 0;
  console.log(`  │  ${exists ? '✓' : '✗'} ${f}${exists ? ` (${(size / 1024).toFixed(1)} KB)` : ' — already gone'}`);
}

console.log('  ├─ Stale Data Files (' + STALE_DATA_FILES.length + ' files)');
for (const f of STALE_DATA_FILES) {
  const fp = path.join(ROOT, f);
  const exists = fs.existsSync(fp);
  const size = exists ? fs.statSync(fp).size : 0;
  console.log(`  │  ${exists ? '✓' : '✗'} ${f}${exists ? ` (${(size / 1024).toFixed(1)} KB)` : ' — already gone'}`);
}

console.log('  ├─ Dead Code (' + DEAD_CODE_FILES.length + ' files)');
for (const f of DEAD_CODE_FILES) {
  const fp = path.join(ROOT, f);
  const exists = fs.existsSync(fp);
  const size = exists ? fs.statSync(fp).size : 0;
  console.log(`  │  ${exists ? '✓' : '✗'} ${f}${exists ? ` (${(size / 1024).toFixed(1)} KB)` : ' — already gone'}`);
}

console.log('  ├─ Old Scripts (' + OLD_SCRIPTS.length + ' files)');
for (const f of OLD_SCRIPTS) {
  const fp = path.join(ROOT, f);
  const exists = fs.existsSync(fp);
  const size = exists ? fs.statSync(fp).size : 0;
  console.log(`  │  ${exists ? '✓' : '✗'} ${f}${exists ? ` (${(size / 1024).toFixed(1)} KB)` : ' — already gone'}`);
}

console.log('  └─ Directories (' + DIRS_TO_DELETE.length + ' dirs)');
for (const d of DIRS_TO_DELETE) {
  const dp = path.join(ROOT, d);
  const exists = fs.existsSync(dp);
  console.log(`     ${exists ? '✓' : '✗'} ${d}/${exists ? '' : ' — already gone'}`);
}

console.log('\n' + '─'.repeat(60));

// ── Phase 2: Delete Files ────────────────────────────────────────────────────
console.log('\n🗑️  Deleting files...\n');

for (const file of allFiles) {
  const fullPath = path.join(ROOT, file);
  if (fs.existsSync(fullPath)) {
    const size = fs.statSync(fullPath).size;
    totalBytesFreed += size;
    fs.unlinkSync(fullPath);
    console.log(`  ✅ Deleted: ${file}`);
    deletedFiles++;
  } else {
    console.log(`  ⏭️  Skipped: ${file} (already gone)`);
    skippedFiles++;
  }
}

// ── Phase 3: Delete Directories ──────────────────────────────────────────────
console.log('\n🗑️  Deleting directories...\n');

for (const dir of DIRS_TO_DELETE) {
  const fullPath = path.join(ROOT, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  ✅ Deleted: ${dir}/`);
    deletedDirs++;
  } else {
    console.log(`  ⏭️  Skipped: ${dir}/ (already gone)`);
    skippedDirs++;
  }
}

// ── Phase 4: Summary ─────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('\n✨ CLEANUP COMPLETE\n');
console.log(`   Files deleted:       ${deletedFiles}`);
console.log(`   Directories deleted: ${deletedDirs}`);
console.log(`   Already gone:        ${skippedFiles + skippedDirs}`);
console.log(`   Space freed:         ${(totalBytesFreed / 1024).toFixed(1)} KB`);
console.log('');
console.log('📌 NEXT STEPS:');
console.log('   1. Delete this cleanup_project.js file');
console.log('   2. Run "npm run dev" to verify the app still works');
console.log('   3. Commit your clean project');
console.log('');

// ── Phase 5: Show final clean structure ──────────────────────────────────────
console.log('📁 CLEAN PROJECT STRUCTURE:\n');
console.log('   fors_simulator-main/');
console.log('   ├── app/');
console.log('   │   ├── (dashboard)/          ← All authenticated pages');
console.log('   │   │   ├── activity/          ← Activity logs (it_support, it_manager)');
console.log('   │   │   ├── admin/             ← Admin panel');
console.log('   │   │   │   ├── audit/         ← Audit logs');
console.log('   │   │   │   ├── dashboard/     ← Admin dashboard');
console.log('   │   │   │   ├── kpi-config/    ← KPI configuration');
console.log('   │   │   │   ├── mapping/       ← Field mapping');
console.log('   │   │   │   ├── sql-console/   ← SQL console');
console.log('   │   │   │   ├── users/         ← User management');
console.log('   │   │   │   └── view-control/  ← View permissions');
console.log('   │   │   ├── analysis/          ← AI analysis (it_support)');
console.log('   │   │   ├── chat/              ← GHOST AI chat (it_support)');
console.log('   │   │   ├── database/          ← FORS Explorer (admin, superadmin)');
console.log('   │   │   ├── kpi-config/        ← KPI config shortcut');
console.log('   │   │   ├── kpis/              ← KPI dashboard (it_report, it_manager)');
console.log('   │   │   ├── lab/               ← Analysis lab (it_support)');
console.log('   │   │   ├── manager/           ← Manager dashboard (it_manager)');
console.log('   │   │   ├── report/            ← Report generation (it_report)');
console.log('   │   │   ├── superadmin/        ← Superadmin panel');
console.log('   │   │   │   ├── dashboard/     ← Superadmin dashboard');
console.log('   │   │   │   ├── database-explorer/');
console.log('   │   │   │   └── integrations/  ← n8n/ServiceNow hub');
console.log('   │   │   ├── tables/            ← Predefined queries');
console.log('   │   │   ├── tickets/           ← Ticket management (it_support)');
console.log('   │   │   └── users/             ← User directory');
console.log('   │   ├── actions/               ← Server actions (admin, view-permissions)');
console.log('   │   ├── actions.ts             ← Main server actions');
console.log('   │   ├── admin/login/           ← Admin login page');
console.log('   │   ├── api/');
console.log('   │   │   ├── ai-analysis/       ← AI analysis endpoint');
console.log('   │   │   ├── analyze/           ← Ticket analysis endpoint');
console.log('   │   │   ├── explorer/          ← DB explorer (fields, indexes)');
console.log('   │   │   └── tickets/           ← Ticket ingestion (n8n/ServiceNow)');
console.log('   │   ├── fors/auth/             ← Auth routes (login, logout)');
console.log('   │   └── login/                 ← Main login page');
console.log('   ├── components/');
console.log('   │   ├── admin/                 ← AdminControlPanel');
console.log('   │   ├── chat/                  ← ChatWindow, conversation buttons');
console.log('   │   ├── kpis/                  ← KPICard, KPICategorySection');
console.log('   │   ├── lab/                   ← SQLRunner');
console.log('   │   ├── layout/               ← Header, Sidebar, ChatBubble');
console.log('   │   ├── tickets/              ← TicketCard, TicketAnalysis, etc.');
console.log('   │   ├── ui/                   ← Badge, Button, Card, Input, etc.');
console.log('   │   └── ConditionalView.tsx   ← Role-based view wrapper');
console.log('   ├── contexts/                 ← ViewPermissionsContext');
console.log('   ├── lib/                      ← Core logic & utilities');
console.log('   │   ├── ai.ts                 ← GHOST AI analysis engine');
console.log('   │   ├── audit.ts              ← Audit logging service');
console.log('   │   ├── auth.ts               ← Authentication & session mgmt');
console.log('   │   ├── chroma.ts             ← ChromaDB vector search');
console.log('   │   ├── constants.ts          ← Status labels, role options');
console.log('   │   ├── db.ts                 ← Database pool & query helpers');
console.log('   │   ├── ollamaClient.ts       ← Ollama LLM client');
console.log('   │   ├── predefined-queries.ts ← Query definitions');
console.log('   │   ├── rag.ts                ← RAG retrieval engine');
console.log('   │   ├── session-config.ts     ← Session cookie config');
console.log('   │   ├── sync-chroma.ts        ← ChromaDB sync jobs');
console.log('   │   ├── ticket-auth.ts        ← Ticket ownership auth');
console.log('   │   ├── translation.ts        ← JSON-to-narrative translation');
console.log('   │   ├── types.ts              ← TypeScript interfaces');
console.log('   │   ├── view-components.ts    ← View permission registry');
console.log('   │   └── xml-parser.ts         ← ServiceNow XML parser');
console.log('   ├── middleware.ts             ← Route protection & RBAC');
console.log('   ├── public/                   ← Static assets');
console.log('   └── [config files]            ← package.json, tsconfig, etc.');
console.log('');
