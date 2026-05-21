const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');
const DataService = require('../services/DataService');

router.get('/sales', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { startDate, endDate, type = 'daily' } = req.query;
  const orders = DataService.get('orders').findAll({});
  const posSales = DataService.get('posSales').findAll({});
  let filteredOrders = orders;
  let filteredPos = posSales;
  if (startDate) {
    filteredOrders = filteredOrders.filter(o => o.createdAt >= startDate);
    filteredPos = filteredPos.filter(s => s.createdAt >= startDate);
  }
  if (endDate) {
    filteredOrders = filteredOrders.filter(o => o.createdAt <= endDate + 'T23:59:59');
    filteredPos = filteredPos.filter(s => s.createdAt <= endDate + 'T23:59:59');
  }
  const onlineTotal = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const posTotal = filteredPos.reduce((s, p) => s + (p.total || 0), 0);
  const dailyData = {};
  [...filteredOrders, ...filteredPos].forEach(item => {
    const date = (item.createdAt || '').split('T')[0];
    if (!dailyData[date]) dailyData[date] = { date, online: 0, pos: 0, total: 0, count: 0 };
    if (item.orderNumber) { dailyData[date].online += item.total || 0; }
    else { dailyData[date].pos += item.total || 0; }
    dailyData[date].total += item.total || 0;
    dailyData[date].count++;
  });
  res.json({
    success: true, data: {
      summary: { onlineTotal, posTotal, grandTotal: onlineTotal + posTotal, onlineCount: filteredOrders.length, posCount: filteredPos.length },
      daily: Object.values(dailyData).sort((a, b) => b.date.localeCompare(a.date)),
    },
  });
}));

router.get('/stock', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const totalStock = products.reduce((s, p) => s + (p.stockQuantity || 0), 0);
  const totalSold = products.reduce((s, p) => s + (p.soldCount || 0), 0);
  const lowStock = products.filter(p => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) <= 10);
  const outOfStock = products.filter(p => (p.stockQuantity || 0) === 0);
  const byCategory = {};
  products.forEach(p => {
    const cat = p.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = { category: cat, count: 0, stock: 0, sold: 0 };
    byCategory[cat].count++;
    byCategory[cat].stock += p.stockQuantity || 0;
    byCategory[cat].sold += p.soldCount || 0;
  });
  res.json({
    success: true, data: {
      summary: { totalProducts: products.length, totalStock, totalSold, soldPercentage: totalStock + totalSold > 0 ? ((totalSold / (totalStock + totalSold)) * 100).toFixed(1) : 0, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length },
      lowStock: lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity, category: p.category })),
      outOfStock: outOfStock.map(p => ({ id: p.id, name: p.name, category: p.category })),
      byCategory: Object.values(byCategory),
    },
  });
}));

router.get('/expiry', authenticate, authorize('admin', 'manager', 'pharmacist'), asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({}).filter(p => p.expiryDate && p.active !== false);
  const now = new Date();
  const expired = products.filter(p => new Date(p.expiryDate) <= now);
  const threeMonths = new Date(); threeMonths.setMonth(threeMonths.getMonth() + 3);
  const expiringSoon = products.filter(p => { const d = new Date(p.expiryDate); return d > now && d <= threeMonths; });
  const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
  const expiringLater = products.filter(p => { const d = new Date(p.expiryDate); return d > threeMonths && d <= sixMonths; });
  res.json({
    success: true, data: {
      expired: expired.map(p => ({ id: p.id, name: p.name, expiryDate: p.expiryDate, stock: p.stockQuantity, batch: p.batchNumber })),
      expiringSoon: expiringSoon.map(p => ({ id: p.id, name: p.name, expiryDate: p.expiryDate, stock: p.stockQuantity, batch: p.batchNumber })),
      expiringLater: expiringLater.map(p => ({ id: p.id, name: p.name, expiryDate: p.expiryDate, stock: p.stockQuantity })),
      summary: { expiredCount: expired.length, expiringSoonCount: expiringSoon.length, expiringLaterCount: expiringLater.length },
    },
  });
}));

router.get('/payments', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let orders = DataService.get('orders').findAll({});
  if (startDate) orders = orders.filter(o => o.createdAt >= startDate);
  if (endDate) orders = orders.filter(o => o.createdAt <= endDate + 'T23:59:59');
  const byMethod = {};
  orders.forEach(o => {
    const method = o.paymentMethod || 'unknown';
    if (!byMethod[method]) byMethod[method] = { method, count: 0, total: 0 };
    byMethod[method].count++;
    byMethod[method].total += o.total || 0;
  });
  const pendingVerification = orders.filter(o => o.paymentStatus === 'pending_verification');
  res.json({
    success: true, data: {
      byMethod: Object.values(byMethod),
      pendingVerification: pendingVerification.length,
      pendingAmount: pendingVerification.reduce((s, o) => s + (o.total || 0), 0),
    },
  });
}));

router.get('/refunds', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const refunds = DataService.get('refunds').findAll({});
  refunds.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = refunds.reduce((s, r) => s + (r.refundTotal || 0), 0);
  res.json({ success: true, data: { refunds, summary: { count: refunds.length, totalAmount: total } } });
}));

router.get('/customers', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const users = DataService.get('users').findAll({}).filter(u => u.role === 'customer');
  const orders = DataService.get('orders').findAll({});
  const customerData = users.map(u => {
    const customerOrders = orders.filter(o => o.customerId === u.id);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((s, o) => s + (o.total || 0), 0),
      lastOrder: customerOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]?.createdAt || null,
      joinedAt: u.createdAt,
    };
  });
  res.json({ success: true, data: customerData });
}));

router.get('/search-logs', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const logs = DataService.get('searchLogs').findAll({}).filter(l => l.resultCount === 0 || l.noResultTerm);
  logs.sort((a, b) => (b.createdAt || b.timestamp || '').localeCompare(a.createdAt || a.timestamp || ''));
  res.json({ success: true, data: logs.slice(0, 100) });
}));

router.get('/analytics', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const products = DataService.get('products').findAll({}).filter(p => p.active !== false);
  const orders = DataService.get('orders').findAll({});
  const posSales = DataService.get('posSales').findAll({});
  const prescriptions = DataService.get('prescriptions').findAll({});
  const searches = DataService.get('searchLogs').findAll({});
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0) + posSales.reduce((s, p) => s + (p.total || 0), 0);
  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 10)
    .map(p => ({ id: p.id, name: p.name, soldCount: p.soldCount || 0, stockQuantity: p.stockQuantity || 0 }));
  const zeroResultSearches = searches.filter(s => s.resultCount === 0 || s.noResultTerm)
    .sort((a, b) => (b.createdAt || b.timestamp || '').localeCompare(a.createdAt || a.timestamp || ''))
    .slice(0, 20);
  res.json({
    success: true,
    data: {
      summary: {
        productCount: products.length,
        orderCount: orders.length,
        posSaleCount: posSales.length,
        prescriptionCount: prescriptions.length,
        revenue,
        pendingPaymentCount: orders.filter(o => o.paymentStatus === 'pending_verification').length,
      },
      topProducts,
      zeroResultSearches,
    },
  });
}));

router.get('/export/:type', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { startDate, endDate } = req.query;
  let data = [];
  let filename = '';
  switch (type) {
    case 'products': data = DataService.get('products').findAll({}); filename = 'products'; break;
    case 'orders': data = DataService.get('orders').findAll({}); filename = 'orders'; break;
    case 'pos-sales': data = DataService.get('posSales').findAll({}); filename = 'pos-sales'; break;
    case 'customers': data = DataService.get('users').findAll({}).filter(u => u.role === 'customer').map(({
      password,
      resetPasswordTokenHash,
      resetPasswordExpiresAt,
      resetPasswordRequestedAt,
      resetPasswordUsedAt,
      ...u
    }) => u); filename = 'customers'; break;
    default: return res.status(400).json({ success: false, message: 'Invalid export type' });
  }
  if (startDate) data = data.filter(d => d.createdAt >= startDate);
  if (endDate) data = data.filter(d => d.createdAt <= endDate + 'T23:59:59');
  if (data.length === 0) return res.json({ success: true, data: [], message: 'No data to export' });
  const headers = Object.keys(data[0]).filter(k => k !== 'password');
  let csv = headers.join(',') + '\n';
  data.forEach(row => {
    csv += headers.map(h => {
      let val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',') + '\n';
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send('\uFEFF' + csv);
}));

module.exports = router;
