const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Get notifications for admin
router.get('/', authenticate, authorize('admin', 'manager', 'pharmacist'), asyncHandler(async (req, res) => {
  const notifications = [];

  // Low stock alerts
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const lowStock = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 10);
  const outOfStock = products.filter(p => (p.stockQuantity || 0) === 0);

  if (outOfStock.length > 0) {
    notifications.push({
      type: 'alert', category: 'stock', severity: 'high',
      title: `${outOfStock.length} products out of stock`,
      titleBn: `${outOfStock.length}টি পণ্যের স্টক শেষ`,
      items: outOfStock.slice(0, 10).map(p => ({ id: p.id, name: p.name, stock: 0 })),
    });
  }
  if (lowStock.length > 0) {
    notifications.push({
      type: 'warning', category: 'stock', severity: 'medium',
      title: `${lowStock.length} products have low stock`,
      titleBn: `${lowStock.length}টি পণ্যের স্টক কম`,
      items: lowStock.slice(0, 10).map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity })),
    });
  }

  // Expiry alerts
  const now = new Date();
  const threeMonths = new Date(); threeMonths.setMonth(threeMonths.getMonth() + 3);
  const expiring = products.filter(p => p.expiryDate && new Date(p.expiryDate) > now && new Date(p.expiryDate) <= threeMonths);
  const expired = products.filter(p => p.expiryDate && new Date(p.expiryDate) <= now);

  if (expired.length > 0) {
    notifications.push({
      type: 'alert', category: 'expiry', severity: 'high',
      title: `${expired.length} products have expired`,
      titleBn: `${expired.length}টি পণ্যের মেয়াদ শেষ`,
      items: expired.slice(0, 10).map(p => ({ id: p.id, name: p.name, expiryDate: p.expiryDate })),
    });
  }
  if (expiring.length > 0) {
    notifications.push({
      type: 'warning', category: 'expiry', severity: 'medium',
      title: `${expiring.length} products expiring within 3 months`,
      titleBn: `${expiring.length}টি পণ্যের মেয়াদ ৩ মাসের মধ্যে শেষ হবে`,
      items: expiring.slice(0, 10).map(p => ({ id: p.id, name: p.name, expiryDate: p.expiryDate })),
    });
  }

  // Pending orders
  const orders = DataService.get('orders').findAll({});
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending');
  const pendingPayments = orders.filter(o => o.paymentStatus === 'pending_verification');

  if (pendingOrders.length > 0) {
    notifications.push({
      type: 'info', category: 'orders', severity: 'medium',
      title: `${pendingOrders.length} pending orders`,
      titleBn: `${pendingOrders.length}টি অর্ডার অপেক্ষমান`,
    });
  }
  if (pendingPayments.length > 0) {
    notifications.push({
      type: 'warning', category: 'payments', severity: 'high',
      title: `${pendingPayments.length} payments need verification`,
      titleBn: `${pendingPayments.length}টি পেমেন্ট যাচাই প্রয়োজন`,
    });
  }

  // Pending prescriptions
  const prescriptions = DataService.get('prescriptions').findAll({});
  const pendingRx = prescriptions.filter(p => p.status === 'pending');
  if (pendingRx.length > 0) {
    notifications.push({
      type: 'info', category: 'prescriptions', severity: 'medium',
      title: `${pendingRx.length} prescriptions pending review`,
      titleBn: `${pendingRx.length}টি প্রেসক্রিপশন পর্যালোচনা অপেক্ষমান`,
    });
  }

  notifications.sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    return (sev[a.severity] || 2) - (sev[b.severity] || 2);
  });

  res.json({ success: true, data: notifications, summary: { total: notifications.length, high: notifications.filter(n => n.severity === 'high').length, medium: notifications.filter(n => n.severity === 'medium').length } });
}));

module.exports = router;
