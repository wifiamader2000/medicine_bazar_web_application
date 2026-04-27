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
const { authenticate, authorize } = require('./middleware/auth');

const app = express();

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
        const fs = require('fs');
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

// Static files - public assets
app.use('/', express.static(config.paths.frontend, { index: false }));
app.use('/uploads/products', express.static(path.join(config.paths.uploads, 'products')));
app.use('/uploads/media', express.static(path.join(config.paths.uploads, 'media')));
app.use('/uploads/logos', express.static(path.join(config.paths.uploads, 'logos')));

// Prescription files are NOT public - served through protected route only

// Admin static files - protected
app.use('/admin', (req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/' || req.path === '') {
    return res.sendFile(path.join(config.paths.frontend, 'admin', 'index.html'));
  }
  next();
}, express.static(path.join(config.paths.frontend, 'admin')));

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
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/suppliers', require('./routes/suppliers'));
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
  ['/doctor-consultation', 'pages/doctor-consultation.html'],
  ['/login', 'pages/login.html'],
  ['/register', 'pages/register.html'],
  ['/account', 'pages/account.html'],
  ['/account/orders', 'pages/account.html'],
  ['/account/prescriptions', 'pages/account.html'],
  ['/account/addresses', 'pages/account.html'],
  ['/account/wishlist', 'pages/account.html'],
  ['/account/loyalty', 'pages/account.html'],
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
app.get('/about.html', (req, res) => res.redirect('/about'));
app.get('/contact.html', (req, res) => res.redirect('/contact'));
app.get('/privacy.html', (req, res) => res.redirect('/privacy'));
app.get('/terms.html', (req, res) => res.redirect('/terms'));
app.get('/return.html', (req, res) => res.redirect('/return'));
app.get('/faq.html', (req, res) => res.redirect('/faq'));

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

const server = app.listen(config.port, config.host, () => {
  console.log(`\n Medicine Bazar Server`);
  console.log(`   URL: http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`);
  console.log(`   Env: ${config.env}`);
  console.log(`   Storage: ${config.db.type}`);
  console.log(`   Products: ${require('./services/DataService').get('products').count()}`);
  console.log('');
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

module.exports = app;
