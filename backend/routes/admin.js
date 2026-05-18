const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { importUpload, logoUpload, mediaUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');
const { parseProductImport, slugify } = require('../services/ProductImportService');
const config = require('../config');

router.get('/dashboard', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const products = DataService.get('products').findAll({});
  const orders = DataService.get('orders').findAll({});
  const posSales = DataService.get('posSales').findAll({});
  const prescriptions = DataService.get('prescriptions').findAll({});
  const users = DataService.get('users').findAll({});
  const refunds = DataService.get('refunds').findAll({});

  const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
  const todayPosSales = posSales.filter(s => s.createdAt?.startsWith(today));
  const monthOrders = orders.filter(o => o.createdAt?.startsWith(thisMonth));
  const monthPosSales = posSales.filter(s => s.createdAt?.startsWith(thisMonth));

  const todaySalesTotal = todayOrders.reduce((s, o) => s + (o.total || 0), 0) + todayPosSales.reduce((s, p) => s + (p.total || 0), 0);
  const monthlySalesTotal = monthOrders.reduce((s, o) => s + (o.total || 0), 0) + monthPosSales.reduce((s, p) => s + (p.total || 0), 0);
  const totalStock = products.reduce((s, p) => s + (p.stockQuantity || 0), 0);
  const totalSold = products.reduce((s, p) => s + (p.soldCount || 0), 0);
  const lowStock = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 10 && p.active !== false);
  const expiringSoon = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiry = new Date(p.expiryDate);
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() + 3);
    return expiry <= threshold && expiry > new Date();
  });

  res.json({
    success: true,
    data: {
      todaySales: todaySalesTotal,
      monthlySales: monthlySalesTotal,
      totalProducts: products.length,
      activeProducts: products.filter(p => p.active !== false).length,
      stockedProducts: products.filter(p => (p.stockQuantity || 0) > 0).length,
      totalStock,
      totalSold,
      soldPercentage: totalStock + totalSold > 0 ? ((totalSold / (totalStock + totalSold)) * 100).toFixed(1) : 0,
      remainingStockPercentage: totalStock + totalSold > 0 ? ((totalStock / (totalStock + totalSold)) * 100).toFixed(1) : 0,
      pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
      pendingPrescriptions: prescriptions.filter(p => p.status === 'pending').length,
      pendingPaymentVerification: orders.filter(o => o.paymentStatus === 'pending_verification').length,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 10).map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity })),
      expiringSoonCount: expiringSoon.length,
      totalCustomers: users.filter(u => u.role === 'customer').length,
      totalOnlineOrders: orders.length,
      totalPosSales: posSales.length,
      totalRefunds: refunds.length,
      onlineSalesTotal: orders.reduce((s, o) => s + (o.total || 0), 0),
      posSalesTotal: posSales.reduce((s, p) => s + (p.total || 0), 0),
      refundTotal: refunds.reduce((s, r) => s + (r.refundTotal || 0), 0),
    },
  });
}));

router.get('/categories', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const categories = DataService.get('categories').findAll({});
  res.json({ success: true, data: categories });
}));

router.post('/categories', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, nameBn, slug, description, imageUrl, parentId, sortOrder } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Category name required' });
  const category = DataService.get('categories').create({
    name, nameBn: nameBn || '', slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '', imageUrl: imageUrl || '', parentId: parentId || null,
    sortOrder: sortOrder || 0, active: true, productCount: 0,
  });
  res.status(201).json({ success: true, data: category });
}));

router.put('/categories/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('categories').update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: updated });
}));

router.delete('/categories/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('categories').delete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
}));

router.get('/brands', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const brands = DataService.get('brands').findAll({});
  res.json({ success: true, data: brands });
}));

router.post('/brands', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, nameBn, slug, description, logoUrl, country } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Brand name required' });
  const brand = DataService.get('brands').create({
    name, nameBn: nameBn || '', slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: description || '', logoUrl: logoUrl || '', country: country || 'Bangladesh',
    active: true, productCount: 0,
  });
  res.status(201).json({ success: true, data: brand });
}));

router.put('/brands/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('brands').update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Brand not found' });
  res.json({ success: true, data: updated });
}));

router.delete('/brands/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('brands').delete(req.params.id);
  res.json({ success: true, message: 'Brand deleted' });
}));

router.post('/import/upload', authenticate, authorize('admin', 'manager'), importUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const existingProducts = DataService.get('products').findAll({});
  const parsed = parseProductImport(req.file.path, req.file.originalname, existingProducts);

  res.json({
    success: true,
    data: {
      totalRows: parsed.rows.length,
      validRows: parsed.validRows.length,
      invalidRows: parsed.invalidRows.length,
      duplicates: parsed.duplicates.length,
      newProducts: parsed.newProducts.length,
      preview: parsed.newProducts.slice(0, 25),
      invalidDetails: parsed.invalidRows.slice(0, 25),
      duplicateDetails: parsed.duplicates.slice(0, 25),
      importId: req.file.filename,
      sourceName: req.file.originalname,
      formatNote: 'CSV and tab-delimited TXT are supported. Excel files are intentionally disabled in production.',
    },
  });
}));

router.post('/import/commit', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { importId, products: legacyProducts } = req.body;
  let products = legacyProducts;
  let invalidRows = [];
  let duplicates = [];

  if (importId) {
    const fs = require('fs');
    const path = require('path');
    const importPath = path.join(config.upload.dir, 'temp', importId);
    if (fs.existsSync(importPath)) {
      const existingProducts = DataService.get('products').findAll({});
      const parsed = parseProductImport(importPath, importId, existingProducts);
      products = parsed.newProducts;
      invalidRows = parsed.invalidRows;
      duplicates = parsed.duplicates;
    }
  }

  if (!products || products.length === 0) {
    return res.status(400).json({ success: false, message: 'No products to import' });
  }

  const imported = DataService.get('products').createMany(products);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set(products.map(p => p.manufacturer).filter(Boolean))];
  const existingCats = DataService.get('categories').findAll({});
  const existingBrands = DataService.get('brands').findAll({});

  for (const cat of categories) {
    if (!existingCats.some(c => c.name.toLowerCase() === cat.toLowerCase())) {
      DataService.get('categories').create({ name: cat, nameBn: '', slug: slugify(cat), active: true });
    }
  }
  for (const brand of brands) {
    if (!existingBrands.some(b => b.name.toLowerCase() === brand.toLowerCase())) {
      DataService.get('brands').create({ name: brand, nameBn: '', slug: slugify(brand), active: true, country: 'Bangladesh' });
    }
  }

  DataService.get('importHistory').create({
    importId,
    count: imported.length,
    failedRows: invalidRows.length,
    duplicates: duplicates.length,
    importedBy: req.user.email,
    productIds: imported.map(p => p.id),
  });

  logAudit(req, 'product_import', { count: imported.length, importId });
  res.json({ success: true, message: `${imported.length} products imported`, messageBn: `${imported.length} products imported`, data: { count: imported.length, failedRows: invalidRows.length, duplicates: duplicates.length } });
}));

router.get('/import/history', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const history = DataService.get('importHistory').findAll({});
  history.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: history });
}));

router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const users = DataService.get('users').findAll({}).map(({ password, ...u }) => u);
  res.json({ success: true, data: users });
}));

router.put('/users/:id/role', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['admin', 'customer', 'cashier', 'pharmacist', 'manager'];
  if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
  DataService.get('users').update(req.params.id, { role });
  logAudit(req, 'user_role_updated', { targetUserId: req.params.id, newRole: role });
  res.json({ success: true, message: 'User role updated' });
}));

router.put('/users/:id/status', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { active } = req.body;
  DataService.get('users').update(req.params.id, { active });
  res.json({ success: true, message: `User ${active ? 'activated' : 'deactivated'}` });
}));

router.get('/audit-logs', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, userId } = req.query;
  let logs = DataService.get('auditLogs').findAll({});
  if (action) logs = logs.filter(l => l.action === action);
  if (userId) logs = logs.filter(l => l.userId === userId);
  logs.sort((a, b) => (b.timestamp || b.createdAt || '').localeCompare(a.timestamp || a.createdAt || ''));
  const total = logs.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const data = logs.slice((p - 1) * l, p * l);
  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
}));

router.get('/settings', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  let settings = DataService.get('settings').findAll({});
  if (settings.length === 0) {
    settings = [DataService.get('settings').create({
      siteName: config.branding.siteName,
      siteNameBn: config.branding.siteNameBn,
      tagline: config.branding.tagline,
      taglineBn: config.branding.taglineBn,
      supportPhone: config.branding.supportPhone,
      whatsapp: config.branding.whatsapp,
      facebook: config.branding.facebook,
      youtube: config.branding.youtube,
      whatsappChannel: config.branding.whatsappChannel,
      headerLogo: '',
      footerLogo: '',
      favicon: '',
      appIcon: '',
      footerText: '',
      footerTextBn: '',
    })];
  }
  res.json({ success: true, data: settings[0] });
}));

router.put('/settings', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const settings = DataService.get('settings').findAll({});
  if (settings.length === 0) return res.status(404).json({ success: false, message: 'Settings not found' });
  const updated = DataService.get('settings').update(settings[0].id, req.body);
  logAudit(req, 'settings_updated', { fields: Object.keys(req.body) });
  res.json({ success: true, data: updated });
}));

router.post('/settings/logo', authenticate, authorize('admin'), logoUpload.single('logo'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  const { type = 'headerLogo' } = req.body;
  const settings = DataService.get('settings').findAll({});
  if (settings.length > 0) {
    DataService.get('settings').update(settings[0].id, { [type]: logoUrl });
  }
  logAudit(req, 'logo_uploaded', { type });
  res.json({ success: true, data: { url: logoUrl, type } });
}));

router.get('/media', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const media = DataService.get('media').findAll({});
  media.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: media });
}));

router.post('/media', authenticate, authorize('admin', 'manager'), mediaUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const mediaItem = DataService.get('media').create({
    fileName: req.file.filename,
    originalName: req.file.originalname,
    url: `/uploads/media/${req.file.filename}`,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    altText: req.body.altText || '',
    altTextBn: req.body.altTextBn || '',
    category: req.body.category || 'general',
    active: true,
  });
  logAudit(req, 'media_uploaded', { mediaId: mediaItem.id });
  res.status(201).json({ success: true, data: mediaItem });
}));

router.put('/media/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const allowed = ['altText', 'altTextBn', 'category', 'active', 'assignedTo', 'usage'];
  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  }
  const media = DataService.get('media').update(req.params.id, updates);
  if (!media) return res.status(404).json({ success: false, message: 'Media not found' });
  logAudit(req, 'media_updated', { mediaId: media.id });
  res.json({ success: true, data: media });
}));

router.delete('/media/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const media = DataService.get('media').findById(req.params.id);
  if (media) {
    const fs = require('fs');
    const filePath = require('path').join(config.upload.dir, 'media', media.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    DataService.get('media').delete(req.params.id);
  }
  res.json({ success: true, message: 'Media deleted' });
}));

router.get('/banners', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: DataService.get('banners').findAll({}) });
}));

router.post('/banners', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const banner = DataService.get('banners').create({ ...req.body, active: true });
  res.status(201).json({ success: true, data: banner });
}));

router.put('/banners/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('banners').update(req.params.id, req.body);
  res.json({ success: true, data: updated });
}));

router.delete('/banners/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('banners').delete(req.params.id);
  res.json({ success: true, message: 'Banner deleted' });
}));

router.get('/coupons', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: DataService.get('coupons').findAll({}) });
}));

router.post('/coupons', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const coupon = DataService.get('coupons').create({ ...req.body, code: (req.body.code || '').toUpperCase(), active: true, usedCount: 0 });
  res.status(201).json({ success: true, data: coupon });
}));

router.put('/coupons/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('coupons').update(req.params.id, req.body);
  res.json({ success: true, data: updated });
}));

router.delete('/coupons/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('coupons').delete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
}));

module.exports = router;
