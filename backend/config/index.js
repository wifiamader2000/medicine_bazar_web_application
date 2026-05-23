const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const rootPath = path.join(__dirname, '../..');
const reactDistPath = path.join(rootPath, 'frontend-react', 'dist');
const legacyFrontendPath = path.join(rootPath, 'frontend');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5050,
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',

  db: {
    type: process.env.DB_DRIVER || process.env.DB_TYPE || 'json',
    connectionString: process.env.DATABASE_URL || null,
    mongoUri: process.env.MONGO_URI || null,
    host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT, 10) || 5432,
    name: process.env.POSTGRES_DB || process.env.DB_NAME || 'medicine_bazar',
    user: process.env.POSTGRES_USER || process.env.DB_USER || 'mb_admin',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
  },

  search: {
    provider: process.env.SEARCH_PROVIDER || 'local',
    meilisearch: {
      host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY || '',
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID || '',
      apiKey: process.env.ALGOLIA_API_KEY || '',
    },
  },

  upload: {
    dir: path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedDocTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },

  paths: {
    root: rootPath,
    frontend: fs.existsSync(path.join(reactDistPath, 'index.html')) ? reactDistPath : legacyFrontendPath,
    legacyFrontend: legacyFrontendPath,
    reactDist: reactDistPath,
    database: path.join(rootPath, 'database'),
    uploads: path.join(rootPath, 'uploads'),
    logs: path.join(rootPath, 'logs'),
  },

  security: {
    bcryptRounds: 12,
    loginRateLimit: { windowMs: 15 * 60 * 1000, max: 10 },
    apiRateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
    captchaAfterFailedAttempts: 5,
  },

  branding: {
    siteName: 'Medicine Bazar',
    siteNameBn: 'মেডিসিন বাজার',
    tagline: 'Your Trusted Pharmacy Partner',
    taglineBn: 'আপনার বিশ্বস্ত ফার্মেসি পার্টনার',
    supportPhone: '01602444532',
    whatsapp: '01602444532',
    facebook: 'https://facebook.com/medicinebazar24',
    youtube: 'https://www.youtube.com/@MedicineBazar24',
    whatsappChannel: 'https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01',
  },

  payment: {
    nagad: { number: '01602444532', name: 'Nagad' },
    bkash: { number: '01602444532', name: 'bKash' },
    upay: { number: '01602444532', name: 'Upay' },
    merchant: { number: '01940826276', name: 'Merchant' },
    bkashMerchantLink: 'https://shop.bkash.com/bismillah-store01940826276/paymentlink',
  },

  isProduction() {
    return this.env === 'production';
  },

  isUsingJsonStore() {
    return this.db.type === 'json';
  },
};

module.exports = config;
