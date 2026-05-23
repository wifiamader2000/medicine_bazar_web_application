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
app.use('/api/v1/invoices', require('./routes/invoices'));
app.use('/api/v1/accounting', require('./routes/accounting'));
app.use('/api/v1/customers', require('./routes/customers'));
app.use('/api/v1/export', require('./routes/export'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/gateways', require('./routes/gateways'));
app.use('/api/v1/banners', require('./routes/banners'));
app.use('/api/v1', require('./routes/public'));

// React SPA routes: public site, customer account, admin panel and POS.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();

  const spaIndex = path.join(config.paths.frontend, 'index.html');
  if (fs.existsSync(spaIndex)) {
    return res.sendFile(spaIndex);
  }

  return next();
});

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
