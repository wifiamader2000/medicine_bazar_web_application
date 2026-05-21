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

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  let copied = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) copied += copyDir(src, dest);
    else {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }
  return copied;
}

const uploadedFiles = copyDir(config.paths.uploads, path.join(backupDir, 'uploads'));
const manifest = {
  createdAt: new Date().toISOString(),
  databaseFiles: files.length,
  uploadedFiles,
  note: 'Schedule this script daily on the staging/production server: npm run backup:daily',
};
fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(`\nBackup complete: ${files.length} DB files, ${uploadedFiles} upload files, ${(totalSize / 1024).toFixed(1)} KB DB total`);
console.log(`Location: ${backupDir}`);
