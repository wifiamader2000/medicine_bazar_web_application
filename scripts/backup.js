const fs = require('fs');
const path = require('path');
const config = require('../backend/config');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(config.paths.root, 'backups', timestamp);

console.log('Medicine Bazar - Database Backup\n');

if (!fs.existsSync(path.join(config.paths.root, 'backups'))) {
  fs.mkdirSync(path.join(config.paths.root, 'backups'), { recursive: true });
}
fs.mkdirSync(backupDir, { recursive: true });

const dbDir = config.paths.database;
if (!fs.existsSync(dbDir)) {
  console.log('No database directory found.');
  process.exit(0);
}

const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json') && f.startsWith('mb_'));
let totalSize = 0;

for (const file of files) {
  const src = path.join(dbDir, file);
  const dest = path.join(backupDir, file);
  fs.copyFileSync(src, dest);
  const stat = fs.statSync(src);
  totalSize += stat.size;
  console.log(`  Backed up: ${file} (${(stat.size / 1024).toFixed(1)} KB)`);
}

console.log(`\nBackup complete: ${files.length} files, ${(totalSize / 1024).toFixed(1)} KB total`);
console.log(`Location: ${backupDir}`);
