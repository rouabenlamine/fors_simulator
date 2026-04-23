/**
 * FORS Project Cleanup Script
 * 
 * Run with: node cleanup.js
 * 
 * This removes all one-off migration/debug scripts, stale data files,
 * and dead code files that are never imported anywhere in the project.
 * 
 * After running this, delete cleanup.js itself.
 */

const fs = require('fs');
const path = require('path');

// ─── Files to delete from root ──────────────────────────────────────────

const rootFiles = [
  // One-off migration scripts
  'add_superadmin.js',
  'add_support_user.js',
  'migrate_admin_modules.js',
  'migrate_chat_schema.js',
  'migrate_rbac.js',
  'migrate_tickets.js',
  'migrate_view_permissions.js',
  'patch_actions.js',
  'reset_admins.js',

  // Debug / inspection scripts
  'check_indexes.js',
  'check_predefined.js',
  'check_users.js',
  'dump_schema.js',
  'dump_users.js',
  'print_schema.js',
  'print_schema2.js',
  'query_schema.js',
  'test_action.js',
  'test_db_hash.js',

  // Stale output / data files
  'dump.txt',
  'schema_audit.txt',
  'schema_output.json',
  'users_list.json',
  'build.log',
  'backup_before_migration.sql',
];

// ─── Directories to delete ──────────────────────────────────────────────

const dirsToDelete = [
  'scratch',             // One-off debug scripts
  'app/api/db',          // Debug-only endpoint (shows ai_analysis schema)
  'app/api/migrate',     // One-time migration endpoint
];

// ─── Backend dead code files ────────────────────────────────────────────

const deadCodeFiles = [
  'lib/api.ts',          // N8N webhook helpers — never imported anywhere
];

// ─── Execution ──────────────────────────────────────────────────────────

let deleted = 0;
let skipped = 0;

console.log('\n🧹 FORS Project Cleanup\n');
console.log('─'.repeat(50));

// Delete root files
console.log('\n📄 Deleting root-level junk files...\n');
for (const file of [...rootFiles, ...deadCodeFiles]) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`  ✅ Deleted: ${file}`);
    deleted++;
  } else {
    console.log(`  ⏭️  Already gone: ${file}`);
    skipped++;
  }
}

// Delete directories (recursive)
console.log('\n📁 Deleting unused directories...\n');
for (const dir of dirsToDelete) {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`  ✅ Deleted: ${dir}/`);
    deleted++;
  } else {
    console.log(`  ⏭️  Already gone: ${dir}/`);
    skipped++;
  }
}

console.log('\n' + '─'.repeat(50));
console.log(`\n✨ Done! Deleted ${deleted} items, ${skipped} already gone.`);
console.log('\n💡 Next steps:');
console.log('   1. Delete this cleanup.js file');
console.log('   2. Run "npm run dev" to verify everything works');
console.log('   3. Commit your changes\n');
