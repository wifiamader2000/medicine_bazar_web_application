const fs = require('fs');
const path = require('path');

console.log('Building Medicine Bazar...\n');

const checks = [];

// Check required directories
const requiredDirs = ['backend', 'frontend', 'database', 'uploads', 'scripts'];
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    checks.push({ name: `Directory: ${dir}`, status: 'pass' });
  } else {
    checks.push({ name: `Directory: ${dir}`, status: 'fail', error: 'Missing' });
  }
}

// Check required files
const requiredFiles = [
  'backend/server.js',
  'backend/config/index.js',
  'backend/middleware/auth.js',
  'backend/middleware/errorHandler.js',
  'backend/routes/auth.js',
  'backend/routes/products.js',
  'backend/routes/search.js',
  'backend/routes/orders.js',
  'backend/routes/cart.js',
  'backend/routes/pos.js',
  'backend/routes/admin.js',
  'backend/routes/prescriptions.js',
  'backend/routes/public.js',
  'backend/services/JsonStore.js',
  'backend/services/DataService.js',
  'frontend/index.html',
  'package.json',
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    checks.push({ name: `File: ${file}`, status: 'pass' });
  } else {
    checks.push({ name: `File: ${file}`, status: 'fail', error: 'Missing' });
  }
}

// Check syntax of JS files
const jsFiles = [];
function findJsFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      findJsFiles(fullPath);
    } else if (entry.name.endsWith('.js')) {
      jsFiles.push(fullPath);
    }
  }
}

findJsFiles(path.join(__dirname, '..', 'backend'));
findJsFiles(path.join(__dirname, '..', 'scripts'));

for (const file of jsFiles) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    new Function('exports', 'require', 'module', '__filename', '__dirname', code);
    checks.push({ name: `Syntax: ${path.relative(path.join(__dirname, '..'), file)}`, status: 'pass' });
  } catch (err) {
    checks.push({ name: `Syntax: ${path.relative(path.join(__dirname, '..'), file)}`, status: 'fail', error: err.message });
  }
}

// Check frontend HTML files
const htmlFiles = [];
function findHtmlFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(fullPath);
    else if (entry.name.endsWith('.html')) htmlFiles.push(fullPath);
  }
}
findHtmlFiles(path.join(__dirname, '..', 'frontend'));
checks.push({ name: `HTML files found: ${htmlFiles.length}`, status: htmlFiles.length > 0 ? 'pass' : 'warn' });

// Print results
const passed = checks.filter(c => c.status === 'pass').length;
const failed = checks.filter(c => c.status === 'fail').length;
const warned = checks.filter(c => c.status === 'warn').length;

console.log('Build Checks:');
for (const check of checks) {
  const icon = check.status === 'pass' ? '[PASS]' : check.status === 'fail' ? '[FAIL]' : '[WARN]';
  console.log(`  ${icon} ${check.name}${check.error ? ` - ${check.error}` : ''}`);
}

console.log(`\nResults: ${passed} passed, ${failed} failed, ${warned} warnings`);

if (failed > 0) {
  console.error('\nBuild FAILED');
  process.exit(1);
} else {
  console.log('\nBuild PASSED');
}
