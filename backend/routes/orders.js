const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const { paymentProofUpload } = require('../middleware/upload');
const DataService = require('../services/DataService');

router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, transactionId, couponCode, note } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty', messageBn: 'কার্ট খালি' });
  }
  if (!shippingAddress) {
    return res.status(400).json({ success: false, message: 'Shipping address required', messageBn: 'ডেলিভারি ঠিকানা প্রয়োজন' });
  }

  let subtotal = 0;
  let discount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = DataService.get('products').findById(item.productId);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` });
    }
    if ((product.stockQuantity || 0) < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}`, messageBn: `${product.name} এর পর্যাপ্ত স্টক নেই` });
    }
    const price = product.sellingPrice || product.mrp || 0;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      productId: product.id,
      name: product.name,
      nameBn: product.nameBn,
      genericName: product.genericName,
      quantity: item.quantity,
      unit: item.unit || product.unitType || 'piece',
      price,
      mrp: product.mrp || 0,
      total: itemTotal,
    });
  }

  if (couponCode) {
    const coupon = DataService.get('coupons').findOne({ code: couponCode.toUpperCase(), active: true });
    if (coupon) {
      const now = new Date();
      if ((!coupon.startDate || new Date(coupon.startDate) <= now) &&
          (!coupon.endDate || new Date(coupon.endDate) >= now) &&
          (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) &&
          (!coupon.usageLimit || (coupon.usedCount || 0) < coupon.usageLimit)) {
        discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        DataService.get('coupons').update(coupon.id, { usedCount: (coupon.usedCount || 0) + 1 });
      }
    }
  }

  const deliveryCharge = subtotal >= 500 ? 0 : 60;
  const total = subtotal - discount + deliveryCharge;

  const order = DataService.get('orders').create({
    orderNumber: 'MB-' + Date.now().toString(36).toUpperCase(),
    customerId: req.user.id,
    customerName: req.user.name,
    customerEmail: req.user.email,
    items: orderItems,
    subtotal,
    discount,
    couponCode: couponCode || null,
    deliveryCharge,
    total,
    shippingAddress,
    paymentMethod: paymentMethod || 'cod',
    transactionId: transactionId || null,
    paymentStatus: paymentMethod === 'cod' ? 'cod' : 'pending_verification',
    orderStatus: 'pending',
    note: note || '',
    statusHistory: [{ status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' }],
  });

  for (const item of orderItems) {
    const product = DataService.get('products').findById(item.productId);
    if (product) {
      DataService.get('products').update(item.productId, {
        stockQuantity: Math.max(0, (product.stockQuantity || 0) - item.quantity),
        soldCount: (product.soldCount || 0) + item.quantity,
      });
    }
  }

  // Award loyalty points (1 point per taka by default)
  const loyaltyConfig = DataService.get('settings').findOne({ key: 'loyalty' });
  const pointsPerTaka = loyaltyConfig?.value?.pointsPerTaka || 1;
  if (loyaltyConfig?.value?.enabled !== false) {
    const earnedPoints = Math.floor(total * pointsPerTaka);
    const user = DataService.get('users').findById(req.user.id);
    if (user) {
      DataService.get('users').update(req.user.id, { loyaltyPoints: (user.loyaltyPoints || 0) + earnedPoints });
    }
    DataService.get('loyaltyPoints').create({
      userId: req.user.id, orderId: order.id, type: 'earned', points: earnedPoints, description: `Order ${order.orderNumber}`,
    });
  }

  logAudit(req, 'order_placed', { orderId: order.id, orderNumber: order.orderNumber, total });
  res.status(201).json({ success: true, message: 'Order placed successfully', messageBn: 'অর্ডার সফলভাবে দেওয়া হয়েছে', data: order });
}));

router.get('/my-orders', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const allOrders = DataService.get('orders').findAll({}).filter(o => o.customerId === req.user.id);
  allOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = allOrders.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const data = allOrders.slice((p - 1) * l, p * l);
  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
}));

router.get('/my-orders/:id', authenticate, asyncHandler(async (req, res) => {
  const order = DataService.get('orders').findById(req.params.id);
  if (!order || order.customerId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  res.json({ success: true, data: order });
}));

router.post('/:id/payment-proof', authenticate, paymentProofUpload.single('proof'), asyncHandler(async (req, res) => {
  const order = DataService.get('orders').findById(req.params.id);
  if (!order || order.customerId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const proofUrl = `/uploads/media/${req.file.filename}`;
  DataService.get('orders').update(req.params.id, { paymentProofUrl: proofUrl, paymentStatus: 'pending_verification' });
  logAudit(req, 'payment_proof_uploaded', { orderId: req.params.id });
  res.json({ success: true, message: 'Payment proof uploaded', messageBn: 'পেমেন্ট প্রমাণ আপলোড হয়েছে' });
}));

router.get('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, paymentStatus, sort } = req.query;
  let orders = DataService.get('orders').findAll({});
  if (status) orders = orders.filter(o => o.orderStatus === status);
  if (paymentStatus) orders = orders.filter(o => o.paymentStatus === paymentStatus);
  orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = orders.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const data = orders.slice((p - 1) * l, p * l);
  res.json({ success: true, data, pagination: { total, page: p, limit: l, totalPages: Math.ceil(total / l) } });
}));

router.put('/:id/status', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { orderStatus, note } = req.body;
  const order = DataService.get('orders').findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const history = order.statusHistory || [];
  history.push({ status: orderStatus, timestamp: new Date().toISOString(), note: note || '', by: req.user.email });
  DataService.get('orders').update(req.params.id, { orderStatus, statusHistory: history });
  logAudit(req, 'order_status_updated', { orderId: req.params.id, newStatus: orderStatus });
  res.json({ success: true, message: 'Order status updated' });
}));

router.put('/:id/verify-payment', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { paymentStatus, note } = req.body;
  const order = DataService.get('orders').findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  DataService.get('orders').update(req.params.id, { paymentStatus, paymentVerifiedBy: req.user.email, paymentVerifiedAt: new Date().toISOString() });
  logAudit(req, 'payment_verification', { orderId: req.params.id, status: paymentStatus });
  res.json({ success: true, message: 'Payment status updated' });
}));

// Delivery tracking update
router.put('/:id/delivery', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { deliveryPerson, deliveryPhone, deliveryNote, estimatedDelivery } = req.body;
  const order = DataService.get('orders').findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const history = order.statusHistory || [];
  history.push({ status: 'delivery_assigned', timestamp: new Date().toISOString(), note: `Assigned to ${deliveryPerson}`, by: req.user.email });
  DataService.get('orders').update(req.params.id, {
    deliveryPerson, deliveryPhone, deliveryNote, estimatedDelivery,
    orderStatus: 'out_for_delivery', statusHistory: history,
  });
  logAudit(req, 'delivery_assigned', { orderId: req.params.id, deliveryPerson });
  res.json({ success: true, message: 'Delivery info updated' });
}));

// Coupon validation (public for checkout)
router.post('/validate-coupon', authenticate, asyncHandler(async (req, res) => {
  const { code, subtotal = 0 } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });
  const coupon = DataService.get('coupons').findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.json({ success: false, message: 'Invalid coupon code', messageBn: 'অবৈধ কুপন কোড' });
  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) return res.json({ success: false, message: 'Coupon not yet active' });
  if (coupon.endDate && new Date(coupon.endDate) < now) return res.json({ success: false, message: 'Coupon expired', messageBn: 'কুপনের মেয়াদ শেষ' });
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) return res.json({ success: false, message: 'Coupon usage limit reached' });
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return res.json({ success: false, message: `Minimum order ৳${coupon.minOrderAmount} required`, messageBn: `সর্বনিম্ন অর্ডার ৳${coupon.minOrderAmount} প্রয়োজন` });
  let discount = coupon.type === 'percentage' ? (subtotal * coupon.value / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  res.json({ success: true, data: { code: coupon.code, type: coupon.type, value: coupon.value, discount: Math.round(discount * 100) / 100, message: `Coupon applied! You save ৳${discount.toFixed(0)}` } });
}));

module.exports = router;
