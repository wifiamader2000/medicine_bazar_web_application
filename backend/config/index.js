const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5050,
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',

  db: {
    type: process.env.DB_TYPE || 'json',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'medicine_bazar',
    user: process.env.DB_USER || 'mb_admin',
    password: process.env.DB_PASSWORD || '',
  },

  upload: {
    dir: path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedDocTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },

  paths: {
    root: path.join(__dirname, '../..'),
    frontend: path.join(__dirname, '../../frontend'),
    database: path.join(__dirname, '../../database'),
    uploads: path.join(__dirname, '../../uploads'),
    logs: path.join(__dirname, '../../logs'),
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
