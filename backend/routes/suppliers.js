const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Supplier CRUD
router.get('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const suppliers = DataService.get('suppliers').findAll({});
  res.json({ success: true, data: suppliers });
}));

router.post('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { name, contactPerson, phone, email, address, gstNumber, licenseNumber, paymentTerms, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Supplier name required' });
  const supplier = DataService.get('suppliers').create({
    name, contactPerson, phone, email, address, gstNumber, licenseNumber, paymentTerms, notes, active: true,
  });
  logAudit(req, 'supplier_created', { supplierId: supplier.id, name });
  res.status(201).json({ success: true, data: supplier });
}));

router.put('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const updated = DataService.get('suppliers').update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Supplier not found' });
  res.json({ success: true, data: updated });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  DataService.get('suppliers').delete(req.params.id);
  res.json({ success: true, message: 'Supplier deleted' });
}));

// Purchase Orders
router.get('/purchase-orders', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status } = req.query;
  let orders = DataService.get('purchaseOrders').findAll({});
  if (status) orders = orders.filter(o => o.status === status);
  orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ success: true, data: orders });
}));

router.post('/purchase-orders', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { supplierId, items, notes, expectedDelivery } = req.body;
  if (!supplierId || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Supplier and items required' });
  }
  const supplier = DataService.get('suppliers').findById(supplierId);
  if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

  const total = items.reduce((sum, item) => sum + ((item.unitCost || 0) * (item.quantity || 0)), 0);
  const po = DataService.get('purchaseOrders').create({
    poNumber: 'PO-' + Date.now().toString(36).toUpperCase(),
    supplierId, supplierName: supplier.name,
    items, total, notes, expectedDelivery,
    status: 'pending',
    statusHistory: [{ status: 'pending', timestamp: new Date().toISOString(), by: req.user.email }],
  });
  logAudit(req, 'purchase_order_created', { poId: po.id, poNumber: po.poNumber, supplierId });
  res.status(201).json({ success: true, data: po });
}));

router.put('/purchase-orders/:id/status', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const po = DataService.get('purchaseOrders').findById(req.params.id);
  if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
  const history = po.statusHistory || [];
  history.push({ status, timestamp: new Date().toISOString(), notes, by: req.user.email });
  DataService.get('purchaseOrders').update(req.params.id, { status, statusHistory: history });

  // If received, update stock
  if (status === 'received' && po.status !== 'received') {
    for (const item of (po.items || [])) {
      if (item.productId) {
        const product = DataService.get('products').findById(item.productId);
        if (product) {
          DataService.get('products').update(item.productId, {
            stockQuantity: (product.stockQuantity || 0) + (item.quantity || 0),
            purchasePrice: item.unitCost || product.purchasePrice,
          });
        }
      }
    }
  }

  logAudit(req, 'purchase_order_status', { poId: req.params.id, status });
  res.json({ success: true, message: 'Purchase order updated' });
}));

// Auto reorder suggestions
router.get('/reorder-suggestions', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const suggestions = products
    .filter(p => (p.stockQuantity || 0) <= (p.reorderLevel || 10))
    .map(p => ({
      id: p.id, name: p.name, genericName: p.genericName, manufacturer: p.manufacturer,
      currentStock: p.stockQuantity || 0, reorderLevel: p.reorderLevel || 10,
      avgMonthlySales: p.soldCount || 0, suggestedQuantity: Math.max(50, (p.soldCount || 10) * 2),
    }))
    .sort((a, b) => a.currentStock - b.currentStock);
  res.json({ success: true, data: suggestions });
}));

module.exports = router;
