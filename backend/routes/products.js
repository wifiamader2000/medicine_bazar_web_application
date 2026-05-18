const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { productImageUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, brand, search, sort, minPrice, maxPrice, inStock, prescriptionRequired } = req.query;
  const store = DataService.get('products');
  let items = store.findAll({});

  if (category) items = items.filter(p => p.category?.toLowerCase() === category.toLowerCase() || p.categorySlug === category);
  if (brand) items = items.filter(p => p.manufacturer?.toLowerCase() === brand.toLowerCase() || p.brandSlug === brand);
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.nameBn || '').toLowerCase().includes(q) ||
      (p.genericName || '').toLowerCase().includes(q) ||
      (p.manufacturer || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.aliases || []).some(a => a.toLowerCase().includes(q)) ||
      (p.uses || '').toLowerCase().includes(q)
    );
  }
  if (minPrice) items = items.filter(p => (p.sellingPrice || p.mrp || 0) >= parseFloat(minPrice));
  if (maxPrice) items = items.filter(p => (p.sellingPrice || p.mrp || 0) <= parseFloat(maxPrice));
  if (inStock === 'true') items = items.filter(p => (p.stockQuantity || 0) > 0);
  if (prescriptionRequired === 'true') items = items.filter(p => p.prescriptionRequired);
  if (prescriptionRequired === 'false') items = items.filter(p => !p.prescriptionRequired);

  items = items.filter(p => p.active !== false);

  if (sort) {
    const [field, order] = sort.split(':');
    items.sort((a, b) => {
      const aVal = a[field] || 0;
      const bVal = b[field] || 0;
      return order === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
    });
  } else {
    items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  const total = items.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const totalPages = Math.ceil(total / l);
  const data = items.slice((p - 1) * l, p * l);

  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages } });
}));

router.get('/featured', asyncHandler(async (req, res) => {
  const items = DataService.get('products').findAll({}).filter(p => p.active !== false && p.featured);
  res.json({ success: true, data: items.slice(0, 12) });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const categories = DataService.get('categories').findAll({}).filter(c => c.active !== false);
  res.json({ success: true, data: categories });
}));

router.get('/brands', asyncHandler(async (req, res) => {
  const brands = DataService.get('brands').findAll({}).filter(b => b.active !== false);
  res.json({ success: true, data: brands });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({});
  const product = DataService.get('products').findById(req.params.id) ||
    products.find(p => p.slug === req.params.id || slugify(p.name) === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found', messageBn: 'পণ্য পাওয়া যায়নি' });

  let alternatives = [];
  if (product.genericName) {
    alternatives = products
      .filter(p => p.id !== product.id && p.genericName === product.genericName && p.active !== false)
      .slice(0, 6);
  }

  let related = [];
  if (product.category) {
    related = products
      .filter(p => p.id !== product.id && p.category === product.category && p.active !== false)
      .slice(0, 6);
  }

  const reviews = DataService.get('reviews').findAll({}).filter(r => r.productId === product.id && r.approved);

  res.json({ success: true, data: { ...product, alternatives, related, reviews } });
}));

router.post('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const product = DataService.get('products').create({
    ...req.body,
    active: req.body.active !== false,
    slug: slugify(req.body.name),
  });
  logAudit(req, 'product_created', { productId: product.id, name: product.name });
  res.status(201).json({ success: true, data: product });
}));

router.put('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const product = DataService.get('products').update(req.params.id, req.body);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  logAudit(req, 'product_updated', { productId: product.id });
  res.json({ success: true, data: product });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const deleted = DataService.get('products').delete(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Product not found' });
  logAudit(req, 'product_deleted', { productId: req.params.id });
  res.json({ success: true, message: 'Product deleted' });
}));

router.post('/:id/image', authenticate, authorize('admin', 'manager'), productImageUpload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
  const imageUrl = `/uploads/products/${req.file.filename}`;
  const product = DataService.get('products').findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const images = product.images || [];
  images.push(imageUrl);
  DataService.get('products').update(req.params.id, { images, imageUrl: images[0] });
  logAudit(req, 'product_image_uploaded', { productId: req.params.id });
  res.json({ success: true, data: { imageUrl, images } });
}));

router.post('/:id/image-from-media', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { mediaId } = req.body;
  const product = DataService.get('products').findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const media = DataService.get('media').findById(mediaId);
  if (!media || media.active === false) return res.status(404).json({ success: false, message: 'Media not found' });
  const images = [media.url, ...(product.images || []).filter(url => url !== media.url)];
  const updated = DataService.get('products').update(req.params.id, { images, imageUrl: media.url, mediaId: media.id });
  DataService.get('media').update(media.id, { assignedTo: req.params.id, usage: 'product' });
  logAudit(req, 'product_media_assigned', { productId: req.params.id, mediaId: media.id });
  res.json({ success: true, data: updated });
}));

function slugify(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/(^-|-$)/g, '');
}

module.exports = router;
