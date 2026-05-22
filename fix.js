const fs = require('fs');
let content = fs.readFileSync('backend/server.js', 'utf8');

const replacement = // API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/home', require('./routes/home'));
app.use('/api/v1/payment-methods', require('./routes/paymentMethods'));
app.use('/api/v1/upload', require('./routes/upload'));
app.use('/api/v1/search', require('./routes/search'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/cart', require('./routes/cart'));
app.use('/api/v1/prescriptions', require('./routes/prescriptions'));
app.use('/api/v1/pos', require('./routes/pos'));
app.use('/api/v1/invoices', require('./routes/invoices'));
app.use('/api/v1/accounting', require('./routes/accounting'));
app.use('/api/v1/customers', require('./routes/customers'));
app.use('/api/v1/export', require('./routes/export'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/lab-tests', require('./routes/labTests'));
app.use('/api/v1/pharmacy', require('./routes/pharmacy'));
app.use('/api/v1/blogs', require('./routes/blogs'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/erp', require('./routes/erp'));
app.use('/api/v1/banners', require('./routes/banners'));
app.use('/api/v1', require('./routes/public'));;

const targetRegex = /\/\/ API Routes[\s\S]*?app\.use\('\/api\/v1', require\('\.\/routes\/public'\)\);/;

content = content.replace(targetRegex, replacement);
fs.writeFileSync('backend/server.js', content);
console.log('Fixed server.js');
