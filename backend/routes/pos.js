const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');

router.post('/open-session', authenticate, authorize('admin', 'cashier', 'manager'), asyncHandler(async (req, res) => {
  const { openingCash = 0 } = req.body;
  const existingOpen = DataService.get('posSessions').findAll({}).find(s => s.cashierId === req.user.id && s.status === 'open');
  if (existingOpen) {
    return res.status(400).json({ success: false, message: 'You already have an open session', messageBn: 'আপনার ইতিমধ্যে একটি খোলা সেশন আছে' });
  }
  const session = DataService.get('posSessions').create({
    cashierId: req.user.id,
    cashierName: req.user.name,
    openingCash: parseFloat(openingCash),
    totalSales: 0,
    totalRefunds: 0,
    salesCount: 0,
    refundCount: 0,
    status: 'open',
    openedAt: new Date().toISOString(),
  });
  logAudit(req, 'pos_session_opened', { sessionId: session.id });
  res.status(201).json({ success: true, data: session });
}));

router.post('/close-session', authenticate, authorize('admin', 'cashier', 'manager'), asyncHandler(async (req, res) => {
  const { closingCash, note } = req.body;
  const session = DataService.get('posSessions').findAll({}).find(s => s.cashierId === req.user.id && s.status === 'open');
  if (!session) return res.status(404).json({ success: false, message: 'No open session found' });

  const expectedCash = session.openingCash + session.totalSales - session.totalRefunds;
  const difference = parseFloat(closingCash || 0) - expectedCash;

  DataService.get('posSessions').update(session.id, {
    closingCash: parseFloat(closingCash || 0),
    expectedCash,
    difference,
    note: note || '',
    status: 'closed',
    closedAt: new Date().toISOString(),
  });

  logAudit(req, 'pos_session_closed', { sessionId: session.id, difference });
  res.json({ success: true, message: 'Session closed', data: { expectedCash, closingCash: parseFloat(closingCash || 0), difference } });
}));

router.get('/current-session', authenticate, authorize('admin', 'cashier', 'manager'), asyncHandler(async (req, res) => {
  const session = DataService.get('posSessions').findAll({}).find(s => s.cashierId === req.user.id && s.status === 'open');
  if (!session) return res.json({ success: true, data: null });
  const sales = DataService.get('posSales').findAll({}).filter(s => s.sessionId === session.id);
  res.json({ success: true, data: { ...session, recentSales: sales.slice(-10) } });
}));

router.post('/sale', authenticate, authorize('admin', 'cashier', 'manager'), asyncHandler(async (req, res) => {
  const { items, paymentMethod = 'cash', customerPhone, discount = 0 } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in bill' });
  }

  const session = DataService.get('posSessions').findAll({}).find(s => s.cashierId === req.user.id && s.status === 'open');
  if (!session) return res.status(400).json({ success: false, message: 'No open POS session. Please open a session first.', messageBn: 'কোনো খোলা POS সেশন নেই। প্রথমে একটি সেশন খুলুন।' });

  let subtotal = 0;
  const saleItems = [];

  for (const item of items) {
    const product = DataService.get('products').findById(item.productId);
    if (!product) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
    if ((product.stockQuantity || 0) < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
    }
    const price = item.price || product.sellingPrice || product.mrp || 0;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;
    saleItems.push({
      productId: product.id,
      name: product.name,
      nameBn: product.nameBn,
      genericName: product.genericName,
      barcode: product.barcode,
      sku: product.sku,
      quantity: item.quantity,
      unit: item.unit || product.unitType || 'piece',
      price,
      total: itemTotal,
    });
  }

  const total = subtotal - parseFloat(discount);
  const invoiceNumber = 'POS-' + Date.now().toString(36).toUpperCase();

  const sale = DataService.get('posSales').create({
    invoiceNumber,
    sessionId: session.id,
    cashierId: req.user.id,
    cashierName: req.user.name,
    items: saleItems,
    subtotal,
    discount: parseFloat(discount),
    total,
    paymentMethod,
    customerPhone: customerPhone || '',
    saleType: 'pos',
    refunded: false,
  });

  for (const item of saleItems) {
    const product = DataService.get('products').findById(item.productId);
    if (product) {
      DataService.get('products').update(item.productId, {
        stockQuantity: Math.max(0, (product.stockQuantity || 0) - item.quantity),
        soldCount: (product.soldCount || 0) + item.quantity,
      });
    }
  }

  DataService.get('posSessions').update(session.id, {
    totalSales: (session.totalSales || 0) + total,
    salesCount: (session.salesCount || 0) + 1,
  });

  logAudit(req, 'pos_sale', { saleId: sale.id, invoiceNumber, total });
  res.status(201).json({ success: true, data: sale });
}));

router.post('/refund', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { saleId, items, reason } = req.body;
  const sale = DataService.get('posSales').findById(saleId);
  if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });

  let refundTotal = 0;
  const refundItems = [];

  for (const refundItem of (items || sale.items)) {
    const originalItem = sale.items.find(i => i.productId === refundItem.productId);
    if (!originalItem) continue;
    const qty = refundItem.quantity || originalItem.quantity;
    const itemRefund = originalItem.price * qty;
    refundTotal += itemRefund;
    refundItems.push({ ...originalItem, quantity: qty, refundAmount: itemRefund });

    const product = DataService.get('products').findById(refundItem.productId);
    if (product) {
      DataService.get('products').update(refundItem.productId, {
        stockQuantity: (product.stockQuantity || 0) + qty,
        soldCount: Math.max(0, (product.soldCount || 0) - qty),
      });
    }
  }

  const refund = DataService.get('refunds').create({
    saleId,
    invoiceNumber: sale.invoiceNumber,
    refundNumber: 'REF-' + Date.now().toString(36).toUpperCase(),
    items: refundItems,
    refundTotal,
    reason: reason || '',
    refundedBy: req.user.email,
  });

  DataService.get('posSales').update(saleId, { refunded: true, refundId: refund.id });

  const session = DataService.get('posSessions').findAll({}).find(s => s.cashierId === req.user.id && s.status === 'open');
  if (session) {
    DataService.get('posSessions').update(session.id, {
      totalRefunds: (session.totalRefunds || 0) + refundTotal,
      refundCount: (session.refundCount || 0) + 1,
    });
  }

  logAudit(req, 'pos_refund', { refundId: refund.id, saleId, refundTotal });
  res.status(201).json({ success: true, data: refund });
}));

router.get('/daily-report', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  const sales = DataService.get('posSales').findAll({}).filter(s => s.createdAt?.startsWith(targetDate));
  const refunds = DataService.get('refunds').findAll({}).filter(r => r.createdAt?.startsWith(targetDate));

  const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalRefunds = refunds.reduce((sum, r) => sum + (r.refundTotal || 0), 0);
  const netSales = totalSales - totalRefunds;
  const paymentBreakdown = {};
  sales.forEach(s => {
    paymentBreakdown[s.paymentMethod || 'cash'] = (paymentBreakdown[s.paymentMethod || 'cash'] || 0) + (s.total || 0);
  });

  res.json({
    success: true, data: {
      date: targetDate,
      salesCount: sales.length,
      refundCount: refunds.length,
      totalSales,
      totalRefunds,
      netSales,
      paymentBreakdown,
    },
  });
}));

module.exports = router;
