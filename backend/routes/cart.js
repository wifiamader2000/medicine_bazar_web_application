const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const DataService = require('../services/DataService');

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const cart = DataService.get('carts').findOne({ userId: req.user.id });
  if (!cart) return res.json({ success: true, data: { items: [], total: 0 } });

  const enrichedItems = (cart.items || []).map(item => {
    const product = DataService.get('products').findById(item.productId);
    if (!product) return null;
    const price = product.sellingPrice || product.mrp || 0;
    return {
      ...item,
      name: product.name,
      nameBn: product.nameBn,
      genericName: product.genericName,
      imageUrl: product.imageUrl || '/assets/images/medicine-placeholder.svg',
      price,
      mrp: product.mrp || 0,
      total: price * item.quantity,
      inStock: (product.stockQuantity || 0) >= item.quantity,
      prescriptionRequired: product.prescriptionRequired || false,
    };
  }).filter(Boolean);

  const total = enrichedItems.reduce((sum, item) => sum + item.total, 0);
  res.json({ success: true, data: { items: enrichedItems, total, itemCount: enrichedItems.length } });
}));

router.post('/add', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity = 1, unit } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });

  const product = DataService.get('products').findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if ((product.stockQuantity || 0) < quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock', messageBn: 'পর্যাপ্ত স্টক নেই' });
  }

  let cart = DataService.get('carts').findOne({ userId: req.user.id });
  if (!cart) {
    cart = DataService.get('carts').create({ userId: req.user.id, items: [] });
  }

  const items = cart.items || [];
  const existingIndex = items.findIndex(i => i.productId === productId);
  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity;
    if (unit) items[existingIndex].unit = unit;
  } else {
    items.push({ productId, quantity, unit: unit || product.unitType || 'piece' });
  }

  DataService.get('carts').update(cart.id, { items });
  res.json({ success: true, message: 'Added to cart', messageBn: 'কার্টে যোগ হয়েছে', data: { itemCount: items.length } });
}));

router.put('/update', authenticate, asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = DataService.get('carts').findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  const items = cart.items || [];
  if (quantity <= 0) {
    const filtered = items.filter(i => i.productId !== productId);
    DataService.get('carts').update(cart.id, { items: filtered });
  } else {
    const index = items.findIndex(i => i.productId === productId);
    if (index >= 0) items[index].quantity = quantity;
    DataService.get('carts').update(cart.id, { items });
  }
  res.json({ success: true, message: 'Cart updated', messageBn: 'কার্ট আপডেট হয়েছে' });
}));

router.delete('/remove/:productId', authenticate, asyncHandler(async (req, res) => {
  const cart = DataService.get('carts').findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
  const items = (cart.items || []).filter(i => i.productId !== req.params.productId);
  DataService.get('carts').update(cart.id, { items });
  res.json({ success: true, message: 'Item removed', messageBn: 'আইটেম সরানো হয়েছে' });
}));

router.delete('/clear', authenticate, asyncHandler(async (req, res) => {
  const cart = DataService.get('carts').findOne({ userId: req.user.id });
  if (cart) DataService.get('carts').update(cart.id, { items: [] });
  res.json({ success: true, message: 'Cart cleared', messageBn: 'কার্ট খালি হয়েছে' });
}));

module.exports = router;
