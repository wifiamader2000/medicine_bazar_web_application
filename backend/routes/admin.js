const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { importUpload, logoUpload, mediaUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');
const { parseProductImport, slugify } = require('../services/ProductImportService');
const { parseBdMedicineDataset, SOURCE: BD_MEDICINE_SOURCE } = require('../services/BdMedicineImportService');
const config = require('../config');

function datasetStores() {
  return {
    products: DataService.get('products').findAll({}),
    brands: DataService.get('brands').findAll({}),
    manufacturers: DataService.get('manufacturers').findAll({}),
    generics: DataService.get('generics').findAll({}),
    indications: DataService.get('indications').findAll({}),
    drugClasses: DataService.get('drugClasses').findAll({}),
    dosageForms: DataService.get('dosageForms').findAll({}),
  };
}

function importFilePath(importId) {
  const safeName = path.basename(String(importId || ''));
  return path.join(config.upload.dir, 'temp', safeName);
}

function normalizeImportFiles(files = []) {
  return files.map(file => ({
    path: file.path || importFilePath(file.importId),
    filename: file.filename || file.importId,
    originalname: file.originalname || file.sourceName || file.filename || file.importId,
  })).filter(file => file.filename && fs.existsSync(file.path));
}

function createMany(storeName, items) {
  if (!items || items.length === 0) return [];
  return DataService.get(storeName).createMany(items);
}

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

router.post('/import/upload', authenticate, authorize('admin', 'manager'), importUpload.any(), asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const mode = req.body.mode || req.body.importMode || (files.length > 1 ? 'bd-medicine-dataset' : 'auto');
  const looksLikeBdDataset = mode === 'bd-medicine-dataset' || files.some(file => /medicine|manufacturer|generic|indication|drug.?class|dosage.?form/i.test(file.originalname));

  if (looksLikeBdDataset) {
    const parsed = parseBdMedicineDataset(files, datasetStores());
    return res.json({
      success: true,
      data: {
        mode: 'bd-medicine-dataset',
        source: BD_MEDICINE_SOURCE,
        files: parsed.files,
        totalRows: parsed.totalRows,
        medicineRows: parsed.medicineRows,
        validRows: parsed.newProducts.length + parsed.updateProducts.length,
        invalidRows: parsed.invalidRows.length,
        duplicates: parsed.duplicateRows.length,
        newProducts: parsed.newProducts.length,
        updateProducts: parsed.updateProducts.length,
        entityCounts: {
          manufacturers: parsed.createEntities.manufacturers.length,
          generics: parsed.createEntities.generics.length,
          indications: parsed.createEntities.indications.length,
          drugClasses: parsed.createEntities.drugClasses.length,
          dosageForms: parsed.createEntities.dosageForms.length,
        },
        preview: parsed.preview,
        invalidDetails: parsed.invalidRows.slice(0, 50),
        duplicateDetails: parsed.duplicateRows.slice(0, 50),
        importFiles: parsed.files.map(file => ({ importId: file.importId, sourceName: file.sourceName, type: file.type })),
        formatNote: 'bd-medicine-scraper/Kaggle-compatible CSV files are supported. Data is imported as reference information, not medical advice.',
      },
    });
  }

  const file = files[0];
  const existingProducts = DataService.get('products').findAll({});
  const parsed = parseProductImport(file.path, file.originalname, existingProducts);

  res.json({
    success: true,
    data: {
      mode: 'legacy-product-csv',
      totalRows: parsed.rows.length,
      validRows: parsed.validRows.length,
      invalidRows: parsed.invalidRows.length,
      duplicates: parsed.duplicates.length,
      newProducts: parsed.newProducts.length,
      preview: parsed.newProducts.slice(0, 25),
      invalidDetails: parsed.invalidRows.slice(0, 25),
      duplicateDetails: parsed.duplicates.slice(0, 25),
      importId: file.filename,
      sourceName: file.originalname,
      formatNote: 'CSV and tab-delimited TXT are supported. Excel files are intentionally disabled in production.',
    },
  });
}));

router.post('/import/commit', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { importId, importFiles, mode, products: legacyProducts } = req.body;
  let products = legacyProducts;
  let invalidRows = [];
  let duplicates = [];

  if (mode === 'bd-medicine-dataset' || Array.isArray(importFiles)) {
    const files = normalizeImportFiles(importFiles || [{ importId }]);
    if (files.length === 0) return res.status(400).json({ success: false, message: 'No import files found. Preview the CSV files again.' });
    const parsed = parseBdMedicineDataset(files, datasetStores());
    const createdProducts = parsed.newProducts.length ? DataService.get('products').createMany(parsed.newProducts) : [];
    const oldProducts = [];
    let updatedCount = 0;
    for (const item of parsed.updateProducts) {
      const existing = DataService.get('products').findById(item.id);
      if (existing) oldProducts.push(existing);
      if (DataService.get('products').update(item.id, item.data)) updatedCount++;
    }

    const createdEntities = {
      manufacturers: createMany('manufacturers', parsed.createEntities.manufacturers),
      brands: createMany('brands', parsed.createEntities.brands),
      generics: createMany('generics', parsed.createEntities.generics),
      indications: createMany('indications', parsed.createEntities.indications),
      drugClasses: createMany('drugClasses', parsed.createEntities.drugClasses),
      dosageForms: createMany('dosageForms', parsed.createEntities.dosageForms),
    };

    const createdEntityIds = Object.fromEntries(Object.entries(createdEntities).map(([key, items]) => [key, items.map(item => item.id)]));
    const history = DataService.get('importHistory').create({
      mode: 'bd-medicine-dataset',
      source: BD_MEDICINE_SOURCE,
      files: parsed.files,
      count: createdProducts.length,
      updatedCount,
      failedRows: parsed.invalidRows.length,
      duplicates: parsed.duplicateRows.length,
      importedBy: req.user.email,
      productIds: createdProducts.map(p => p.id),
      updatedProductIds: parsed.updateProducts.map(item => item.id),
      oldProducts,
      createdEntityIds,
      entityCounts: Object.fromEntries(Object.entries(createdEntities).map(([key, items]) => [key, items.length])),
      rollbackSafe: true,
      rolledBack: false,
    });

    logAudit(req, 'bd_medicine_dataset_import', {
      importHistoryId: history.id,
      createdProducts: createdProducts.length,
      updatedProducts: updatedCount,
      failedRows: parsed.invalidRows.length,
      duplicates: parsed.duplicateRows.length,
      source: BD_MEDICINE_SOURCE,
    });

    return res.json({
      success: true,
      message: `${createdProducts.length} products imported, ${updatedCount} updated`,
      data: {
        importHistoryId: history.id,
        count: createdProducts.length,
        updatedCount,
        failedRows: parsed.invalidRows.length,
        duplicates: parsed.duplicateRows.length,
        entityCounts: history.entityCounts,
        source: BD_MEDICINE_SOURCE,
      },
    });
  }

  if (importId) {
    const importPath = importFilePath(importId);
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
    mode: 'legacy-product-csv',
    source: 'catalog-import',
    count: imported.length,
    failedRows: invalidRows.length,
    duplicates: duplicates.length,
    importedBy: req.user.email,
    productIds: imported.map(p => p.id),
    rollbackSafe: true,
    rolledBack: false,
  });

  logAudit(req, 'product_import', { count: imported.length, importId });
  res.json({ success: true, message: `${imported.length} products imported`, messageBn: `${imported.length} products imported`, data: { count: imported.length, failedRows: invalidRows.length, duplicates: duplicates.length } });
}));

router.get('/import/history', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const history = DataService.get('importHistory').findAll({});
  history.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: history });
}));

router.get('/import/stats', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({});
  const sourceProducts = products.filter(p => p.source === BD_MEDICINE_SOURCE || p.importedSource === BD_MEDICINE_SOURCE);
  res.json({
    success: true,
    data: {
      importedMedicines: sourceProducts.length,
      manufacturers: DataService.get('manufacturers').count(),
      generics: DataService.get('generics').count(),
      indications: DataService.get('indications').count(),
      drugClasses: DataService.get('drugClasses').count(),
      dosageForms: DataService.get('dosageForms').count(),
      source: BD_MEDICINE_SOURCE,
    },
  });
}));

router.post('/import/:id/rollback', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const history = DataService.get('importHistory').findById(req.params.id);
  if (!history || !history.rollbackSafe || history.rolledBack) {
    return res.status(400).json({ success: false, message: 'Import cannot be rolled back safely' });
  }

  let deletedProducts = 0;
  for (const productId of history.productIds || []) {
    if (DataService.get('products').delete(productId)) deletedProducts++;
  }

  let restoredProducts = 0;
  for (const product of history.oldProducts || []) {
    if (DataService.get('products').update(product.id, product)) restoredProducts++;
  }

  const deletedEntities = {};
  for (const [storeName, ids] of Object.entries(history.createdEntityIds || {})) {
    deletedEntities[storeName] = 0;
    const actualStore = storeName === 'drugClasses' ? 'drugClasses' : storeName;
    if (!DataService.getStoreNames().includes(actualStore)) continue;
    for (const id of ids || []) {
      if (DataService.get(actualStore).delete(id)) deletedEntities[storeName]++;
    }
  }

  DataService.get('importHistory').update(history.id, {
    rolledBack: true,
    rolledBackAt: new Date().toISOString(),
    rolledBackBy: req.user.email,
  });
  logAudit(req, 'import_rollback', { importHistoryId: history.id, deletedProducts, restoredProducts });
  res.json({ success: true, data: { deletedProducts, restoredProducts, deletedEntities } });
}));

router.get('/users', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const users = DataService.get('users').findAll({}).map(({
    password,
    resetPasswordTokenHash,
    resetPasswordExpiresAt,
    resetPasswordRequestedAt,
    resetPasswordUsedAt,
    ...u
  }) => u);
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

router.get('/campaigns', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const campaigns = DataService.get('campaigns').findAll({});
  campaigns.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: campaigns });
}));

router.post('/campaigns', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { title, titleBn, type, startDate, endDate, discountPercent, bannerUrl, active = true } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Campaign title required' });
  const campaign = DataService.get('campaigns').create({
    title,
    titleBn: titleBn || '',
    type: type || 'general',
    startDate: startDate || null,
    endDate: endDate || null,
    discountPercent: Number(discountPercent || 0),
    bannerUrl: bannerUrl || '',
    active: active !== false,
  });
  logAudit(req, 'campaign_created', { campaignId: campaign.id, title: campaign.title });
  res.status(201).json({ success: true, data: campaign });
}));

router.put('/campaigns/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('campaigns').update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Campaign not found' });
  logAudit(req, 'campaign_updated', { campaignId: req.params.id });
  res.json({ success: true, data: updated });
}));

router.delete('/campaigns/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('campaigns').delete(req.params.id);
  logAudit(req, 'campaign_deleted', { campaignId: req.params.id });
  res.json({ success: true, message: 'Campaign deleted' });
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
