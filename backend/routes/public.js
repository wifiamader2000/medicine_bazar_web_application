const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const DataService = require('../services/DataService');
const config = require('../config');

router.get('/health', (req, res) => {
  const storageMode = DataService.getStorageMode();
  const productCount = DataService.get('products').count();
  const isProduction = config.isProduction();
  const usingJson = config.isUsingJsonStore();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '1.0.0',
      storageMode,
      productCount,
      environment: config.env,
      warning: isProduction && usingJson ? 'Production is using JSON file-store. Connect a database.' : null,
      timestamp: new Date().toISOString(),
    },
  });
});

router.get('/branding', asyncHandler(async (req, res) => {
  let settings = DataService.get('settings').findAll({});
  const data = settings.length > 0 ? settings[0] : {
    siteName: config.branding.siteName,
    siteNameBn: config.branding.siteNameBn,
    tagline: config.branding.tagline,
    taglineBn: config.branding.taglineBn,
    supportPhone: config.branding.supportPhone,
    whatsapp: config.branding.whatsapp,
    facebook: config.branding.facebook,
    youtube: config.branding.youtube,
    whatsappChannel: config.branding.whatsappChannel,
  };
  res.json({ success: true, data });
}));

router.get('/homepage', asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const categories = DataService.get('categories').findAll({}).filter(c => c.active !== false);
  const banners = DataService.get('banners').findAll({}).filter(b => b.active !== false);

  const featured = products.filter(p => p.featured).slice(0, 12);
  const newArrivals = [...products].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 12);
  const bestSellers = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 12);
  const discounted = products.filter(p => p.sellingPrice && p.mrp && p.sellingPrice < p.mrp).slice(0, 12);

  res.json({
    success: true,
    data: {
      banners,
      categories: categories.slice(0, 12),
      featured,
      newArrivals,
      bestSellers,
      discounted,
      productCount: products.length,
    },
  });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const categories = DataService.get('categories').findAll({}).filter(c => c.active !== false);
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const enriched = categories.map(c => ({
    ...c,
    productCount: products.filter(p => p.category === c.name || p.categorySlug === c.slug).length,
  }));
  res.json({ success: true, data: enriched });
}));

router.get('/banners', asyncHandler(async (req, res) => {
  const banners = DataService.get('banners').findAll({}).filter(b => b.active !== false);
  res.json({ success: true, data: banners });
}));

router.get('/payment-methods', (req, res) => {
  res.json({
    success: true,
    data: {
      cod: { name: 'Cash on Delivery', nameBn: 'ক্যাশ অন ডেলিভারি', available: true },
      nagad: { ...config.payment.nagad, nameBn: 'নগদ', available: true, type: 'manual' },
      bkash: { ...config.payment.bkash, nameBn: 'বিকাশ', available: true, type: 'manual' },
      upay: { ...config.payment.upay, nameBn: 'উপে', available: true, type: 'manual' },
      merchant: { ...config.payment.merchant, nameBn: 'মার্চেন্ট', available: true, type: 'manual' },
      bkashMerchantLink: { name: 'bKash Payment Link', nameBn: 'বিকাশ পেমেন্ট লিংক', url: config.payment.bkashMerchantLink, available: true, type: 'link' },
      sslcommerz: { name: 'SSLCommerz', available: false, type: 'gateway', placeholder: true },
      bkashApi: { name: 'bKash API', available: false, type: 'gateway', placeholder: true },
      nagadApi: { name: 'Nagad API', available: false, type: 'gateway', placeholder: true },
    },
  });
});

router.post('/contact', asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ success: false, message: 'Name and message required' });
  }
  DataService.get('notifications').create({ type: 'contact', name, email, phone, subject, message, read: false });
  res.json({ success: true, message: 'Message sent successfully', messageBn: 'বার্তা সফলভাবে পাঠানো হয়েছে' });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const stats = DataService.getStats();
  res.json({ success: true, data: stats });
}));

module.exports = router;
