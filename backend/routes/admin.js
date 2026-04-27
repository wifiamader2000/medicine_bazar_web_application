const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { importUpload, logoUpload, mediaUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');
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

  const categoryCounts = {};
  products.filter(p => p.active !== false).forEach(p => {
    const cat = p.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

  const topProducts = [...products].filter(p => p.active !== false).sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 10).map(p => ({ id: p.id, name: p.name, strength: p.strength, sold: p.soldCount || 0, stock: p.stockQuantity || 0 }));

  const manufacturerCounts = {};
  products.filter(p => p.active !== false).forEach(p => {
    const m = p.manufacturer || 'Unknown';
    manufacturerCounts[m] = (manufacturerCounts[m] || 0) + 1;
  });
  const topManufacturers = Object.entries(manufacturerCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

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
      categoryBreakdown,
      topProducts,
      topManufacturers,
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
  const ext = require('path').extname(req.file.originalname).toLowerCase();
  let rows = [];

  if (ext === '.csv') {
    const { parse } = require('csv-parse/sync');
    const content = require('fs').readFileSync(req.file.path, 'utf8');
    rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
  } else if (ext === '.xlsx' || ext === '.xls') {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet);
  } else if (ext === '.txt') {
    const content = require('fs').readFileSync(req.file.path, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 1) {
      const headers = lines[0].split('\t').map(h => h.trim());
      rows = lines.slice(1).map(line => {
        const values = line.split('\t');
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (values[i] || '').trim(); });
        return obj;
      });
    }
  }

  const fieldMap = {
    'medicine name': 'name', 'brand name': 'name', 'product name': 'name', 'name': 'name',
    'bangla name': 'nameBn', 'bn name': 'nameBn', 'nameBn': 'nameBn',
    'generic name': 'genericName', 'generic': 'genericName', 'genericName': 'genericName',
    'company': 'manufacturer', 'manufacturer': 'manufacturer', 'brand': 'manufacturer',
    'category': 'category', 'strength': 'strength', 'dosage form': 'dosageForm', 'dosageForm': 'dosageForm',
    'pack size': 'packSize', 'packSize': 'packSize', 'barcode': 'barcode', 'sku': 'sku',
    'mrp': 'mrp', 'price': 'mrp', 'selling price': 'sellingPrice', 'sellingPrice': 'sellingPrice',
    'purchase price': 'purchasePrice', 'purchasePrice': 'purchasePrice', 'cost': 'purchasePrice',
    'stock': 'stockQuantity', 'stock quantity': 'stockQuantity', 'stockQuantity': 'stockQuantity', 'qty': 'stockQuantity',
    'unit': 'unitType', 'unit type': 'unitType', 'unitType': 'unitType',
    'batch': 'batchNumber', 'batch number': 'batchNumber', 'batchNumber': 'batchNumber',
    'expiry': 'expiryDate', 'expiry date': 'expiryDate', 'expiryDate': 'expiryDate',
    'prescription required': 'prescriptionRequired', 'prescriptionRequired': 'prescriptionRequired', 'rx': 'prescriptionRequired',
    'uses': 'uses', 'dosage': 'dosage', 'side effects': 'sideEffects', 'sideEffects': 'sideEffects',
    'warning': 'warning', 'storage': 'storage', 'image': 'imageUrl', 'image url': 'imageUrl',
    'aliases': 'aliases', 'keywords': 'searchKeywords',
  };

  const validRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {
    const mapped = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const key = rawKey.toLowerCase().trim();
      const mappedKey = fieldMap[key] || key;
      mapped[mappedKey] = value;
    }

    if (!mapped.name || String(mapped.name).trim().length === 0) {
      invalidRows.push({ row: index + 2, data: row, error: 'Missing medicine name' });
      return;
    }

    mapped.name = String(mapped.name).trim();
    mapped.mrp = parseFloat(mapped.mrp) || 0;
    mapped.sellingPrice = parseFloat(mapped.sellingPrice) || mapped.mrp;
    mapped.purchasePrice = parseFloat(mapped.purchasePrice) || 0;
    mapped.stockQuantity = parseInt(mapped.stockQuantity) || 0;
    mapped.prescriptionRequired = ['true', 'yes', '1', 'rx'].includes(String(mapped.prescriptionRequired || '').toLowerCase());
    mapped.active = true;
    mapped.slug = mapped.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (typeof mapped.aliases === 'string') mapped.aliases = mapped.aliases.split(',').map(a => a.trim());
    if (typeof mapped.searchKeywords === 'string') mapped.searchKeywords = mapped.searchKeywords.split(',').map(a => a.trim());

    validRows.push(mapped);
  });

  const existingProducts = DataService.get('products').findAll({});
  const duplicates = [];
  const newProducts = [];

  for (const product of validRows) {
    const isDup = existingProducts.some(ep =>
      (ep.name?.toLowerCase() === product.name.toLowerCase() && ep.strength === product.strength && ep.manufacturer === product.manufacturer) ||
      (product.barcode && ep.barcode === product.barcode) ||
      (product.sku && ep.sku === product.sku)
    );
    if (isDup) {
      duplicates.push(product);
    } else {
      newProducts.push(product);
    }
  }

  res.json({
    success: true,
    data: {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      duplicates: duplicates.length,
      newProducts: newProducts.length,
      preview: newProducts.slice(0, 20),
      invalidDetails: invalidRows.slice(0, 20),
      duplicateDetails: duplicates.slice(0, 20),
      importId: req.file.filename,
    },
  });
}));

router.post('/import/commit', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { importId, products } = req.body;
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
      DataService.get('categories').create({ name: cat, nameBn: '', slug: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'), active: true });
    }
  }
  for (const brand of brands) {
    if (!existingBrands.some(b => b.name.toLowerCase() === brand.toLowerCase())) {
      DataService.get('brands').create({ name: brand, nameBn: '', slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'), active: true, country: 'Bangladesh' });
    }
  }

  DataService.get('importHistory').create({
    importId,
    count: imported.length,
    importedBy: req.user.email,
    productIds: imported.map(p => p.id),
  });

  logAudit(req, 'product_import', { count: imported.length, importId });
  res.json({ success: true, message: `${imported.length} products imported`, messageBn: `${imported.length}টি পণ্য ইম্পোর্ট হয়েছে`, data: { count: imported.length } });
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
