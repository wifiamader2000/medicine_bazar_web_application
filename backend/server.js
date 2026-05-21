const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { extractToken, verifyToken, logAudit } = require('./middleware/auth');
const DataService = require('./services/DataService');

const app = express();

const fs = require('fs');
for (const dir of [config.paths.logs, config.paths.database, config.paths.uploads]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());

// Logging
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => {
        const logPath = path.join(config.paths.logs, 'access.log');
        fs.appendFileSync(logPath, message);
      },
    },
  }));
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.security.apiRateLimit.windowMs,
  max: config.security.apiRateLimit.max,
  message: { success: false, message: 'Too many requests', messageBn: 'অনেক বেশি অনুরোধ' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

function adminSectionFromPath(reqPath) {
  const page = path.basename(reqPath || '', '.html').toLowerCase();
  if (!page || page === 'admin' || page === 'index') return 'dashboard';
  if (page === 'dashboard') return 'dashboard';
  if (page === 'pos') return 'pos';
  if (['prescription', 'prescriptions', 'prescription-queue'].includes(page)) return 'prescriptions';
  return page;
}

function rolesForAdminSection(section) {
  if (section === 'pos') return ['admin', 'cashier'];
  if (section === 'prescriptions') return ['admin', 'pharmacist'];
  return ['admin'];
}

function sendAdminForbidden(res, section) {
  res.status(403).send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Access denied - Medicine Bazar</title><link rel="stylesheet" href="/css/style.css"></head>
<body><section class="section"><div class="container" style="max-width:560px;"><div class="card text-center">
<h1>403</h1><h2>Access denied</h2><p>You do not have permission to open this admin page.</p>
<p style="color:var(--text-muted);font-size:14px;">Requested section: ${section}</p>
<a class="btn btn-primary" href="/">Go home</a></div></div></section></body></html>`);
}

function protectAdminPage(req, res, next) {
  const wantsAdminPage = req.path === '/' || req.path === '' || req.path.endsWith('.html');
  if (!wantsAdminPage) return next();

  const token = extractToken(req);
  const redirectTarget = `/login.html?next=${encodeURIComponent(req.originalUrl)}`;
  if (!token) {
    logAudit(req, 'unauthorized_admin_access_attempt', { reason: 'not_logged_in', section: adminSectionFromPath(req.path) });
    return res.redirect(302, redirectTarget);
  }

  const decoded = verifyToken(token);
  const user = decoded ? DataService.get('users').findById(decoded.id) : null;
  if (!user || !user.active) {
    logAudit(req, 'unauthorized_admin_access_attempt', { reason: 'invalid_or_inactive_session', section: adminSectionFromPath(req.path) });
    res.clearCookie('token');
    return res.redirect(302, redirectTarget);
  }

  req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
  const section = adminSectionFromPath(req.path);
  const allowedRoles = rolesForAdminSection(section);
  if (!allowedRoles.includes(user.role)) {
    logAudit(req, 'unauthorized_admin_access_attempt', { section, requiredRoles: allowedRoles, userRole: user.role });
    return sendAdminForbidden(res, section);
  }

  logAudit(req, 'admin_page_access', { section });
  return res.sendFile(path.join(config.paths.frontend, 'admin', 'index.html'));
}

// Admin static files must be registered before the public root static middleware.
app.use('/admin', protectAdminPage, express.static(path.join(config.paths.frontend, 'admin'), { index: false }));

// Static files - public assets
app.use('/', express.static(config.paths.frontend, { index: false }));
app.use('/uploads/products', express.static(path.join(config.paths.uploads, 'products')));
app.use('/uploads/media', express.static(path.join(config.paths.uploads, 'media')));
app.use('/uploads/logos', express.static(path.join(config.paths.uploads, 'logos')));

// Prescription files are NOT public - served through protected route only

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/search', require('./routes/search'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/cart', require('./routes/cart'));
app.use('/api/v1/prescriptions', require('./routes/prescriptions'));
app.use('/api/v1/pos', require('./routes/pos'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/lab-tests', require('./routes/labTests'));
app.use('/api/v1/pharmacy', require('./routes/pharmacy'));
app.use('/api/v1/blogs', require('./routes/blogs'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/erp', require('./routes/erp'));
app.use('/api/v1/banners', require('./routes/banners'));
app.use('/api/v1', require('./routes/public'));

// Page routes - serve HTML pages
const pageRoutes = [
  ['/', 'index.html'],
  ['/shop', 'pages/shop.html'],
  ['/search', 'pages/search.html'],
  ['/cart', 'pages/cart.html'],
  ['/checkout', 'pages/checkout.html'],
  ['/prescription-upload', 'pages/prescription-upload.html'],
  ['/lab-tests', 'pages/lab-tests.html'],
  ['/pharmacy-registration', 'pages/pharmacy-registration.html'],
  ['/blog', 'pages/blog.html'],
  ['/about', 'pages/about.html'],
  ['/contact', 'pages/contact.html'],
  ['/privacy', 'pages/privacy.html'],
  ['/terms', 'pages/terms.html'],
  ['/return', 'pages/return.html'],
  ['/faq', 'pages/faq.html'],
  ['/login', 'pages/login.html'],
  ['/login.html', 'pages/login.html'],
  ['/forgot-password', 'pages/forgot-password.html'],
  ['/forgot-password.html', 'pages/forgot-password.html'],
  ['/reset-password', 'pages/reset-password.html'],
  ['/reset-password.html', 'pages/reset-password.html'],
  ['/register', 'pages/register.html'],
  ['/register.html', 'pages/register.html'],
  ['/shipping-policy', 'pages/shipping-policy.html'],
  ['/shipping-policy.html', 'pages/shipping-policy.html'],
  ['/account', 'pages/account.html'],
  ['/account/orders', 'pages/account.html'],
  ['/account/prescriptions', 'pages/account.html'],
  ['/account/wishlist', 'pages/account.html'],
  ['/account/addresses', 'pages/account.html'],
  ['/account/profile', 'pages/account.html'],
];

for (const [route, file] of pageRoutes) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(config.paths.frontend, file));
  });
}

// Dynamic routes
app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(config.paths.frontend, 'pages/product-detail.html'));
});
app.get('/category/:slug', (req, res) => {
  res.sendFile(path.join(config.paths.frontend, 'pages/category.html'));
});
app.get('/brand/:slug', (req, res) => {
  res.sendFile(path.join(config.paths.frontend, 'pages/brand.html'));
});
app.get('/blog/:slug', (req, res) => {
  res.sendFile(path.join(config.paths.frontend, 'pages/blog-detail.html'));
});

// Backward compatibility
app.get('/about.html', (req, res) => res.sendFile(path.join(config.paths.frontend, 'pages/about.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(config.paths.frontend, 'pages/contact.html')));
app.get('/privacy.html', (req, res) => res.sendFile(path.join(config.paths.frontend, 'pages/privacy.html')));
app.get('/terms.html', (req, res) => res.sendFile(path.join(config.paths.frontend, 'pages/terms.html')));
app.get('/return.html', (req, res) => res.sendFile(path.join(config.paths.frontend, 'pages/return.html')));
app.get('/faq.html', (req, res) => res.sendFile(path.join(config.paths.frontend, 'pages/faq.html')));

// 404 and error handling
app.use(notFound);
app.use(errorHandler);

// Production JSON warning
if (config.isProduction() && config.isUsingJsonStore()) {
  console.warn('\n⚠️  WARNING: Production is using JSON file-store!');
  console.warn('   Connect a production database (PostgreSQL/MySQL) for reliability.\n');
}

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

let server;

async function startServer() {
  if (server) return server;

  if (config.db.type === 'mongodb') {
    const mongoose = require('mongoose');
    try {
      await mongoose.connect(config.db.mongoUri);
      console.log('MongoDB connected successfully');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    }
  }

  await DataService.init();

  server = app.listen(config.port, config.host, async () => {
    console.log(`\n Medicine Bazar Server`);
    console.log(`   URL: http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`);
    console.log(`   Env: ${config.env}`);
    console.log(`   Storage: ${config.db.type}`);
    console.log(`   Products: ${await require('./services/DataService').get('products').count()}`);
    console.log('');
  });
  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = { app, startServer };
