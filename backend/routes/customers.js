const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Helper to normalize phone
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-11); // e.g. 017XXXXXXXX
};

// 1. POST /api/v1/customers - Create or return existing customer
router.post('/', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const { name, phone, email, address, notes, customerType } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const normPhone = normalizePhone(phone);
  if (!normPhone) {
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  }

  const existing = DataService.get('customers').findAll({}).find(c => c.phone === normPhone);
  if (existing) {
    return res.status(200).json({ success: true, message: 'Customer already exists', data: existing });
  }

  const customer = DataService.get('customers').create({
    name: name || '',
    phone: normPhone,
    email: email || '',
    address: address || '',
    customerType: customerType || 'walk_in',
    totalPurchase: 0,
    totalPaid: 0,
    dueBalance: 0,
    lastVisitAt: null,
    notes: notes || '',
  });

  logAudit(req, 'customer_created', { customerId: customer.id, phone: normPhone });
  res.status(201).json({ success: true, message: 'Customer created', data: customer });
}));

// 2. GET /api/v1/customers - List customers
router.get('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { search, dueOnly, page = 1, limit = 50 } = req.query;
  let customers = DataService.get('customers').findAll({});

  let totalDue = 0;
  let customersWithDue = 0;

  customers.forEach(c => {
    if (c.dueBalance > 0) {
      totalDue += c.dueBalance;
      customersWithDue++;
    }
  });

  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(c => 
      (c.phone && c.phone.includes(q)) || 
      (c.name && c.name.toLowerCase().includes(q))
    );
  }

  if (dueOnly === 'true') {
    customers = customers.filter(c => c.dueBalance > 0);
  }

  // Sort by most recently updated or created
  customers.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const total = customers.length;
  const paged = customers.slice((page - 1) * limit, page * limit);

  res.json({
    success: true,
    data: paged,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    summary: { totalDue, customersWithDue }
  });
}));

// 8. GET /api/v1/customers/summary - CRM Dashboard Summary
router.get('/summary', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const customers = DataService.get('customers').findAll({});
  const ledgers = DataService.get('customerLedgers').findAll({});
  
  let totalCustomers = customers.length;
  let customersWithDue = 0;
  let totalDue = 0;
  
  customers.forEach(c => {
    if (c.dueBalance > 0) {
      customersWithDue++;
      totalDue += c.dueBalance;
    }
  });

  const topDueCustomers = customers
    .filter(c => c.dueBalance > 0)
    .sort((a, b) => b.dueBalance - a.dueBalance)
    .slice(0, 5);

  const today = new Date().toISOString().split('T')[0];
  const dueCollectedToday = ledgers
    .filter(l => l.type === 'payment' && l.date?.startsWith(today))
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  res.json({
    success: true,
    data: {
      totalCustomers,
      customersWithDue,
      totalDue,
      dueCollectedToday,
      topDueCustomers
    }
  });
}));

// 4. GET /api/v1/customers/phone/:phone - Lookup
router.get('/phone/:phone', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const normPhone = normalizePhone(req.params.phone);
  const customer = DataService.get('customers').findAll({}).find(c => c.phone === normPhone);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }
  res.json({ success: true, data: customer });
}));

// 3. GET /api/v1/customers/:id - Profile
router.get('/:id', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const customer = DataService.get('customers').findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  
  const ledgers = DataService.get('customerLedgers').findAll({}).filter(l => l.customerId === customer.id);
  ledgers.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ 
    success: true, 
    data: {
      ...customer,
      recentLedger: ledgers.slice(0, 10)
    } 
  });
}));

// 7. GET /api/v1/customers/:id/ledger - Full ledger
router.get('/:id/ledger', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { from, to, type } = req.query;
  let ledgers = DataService.get('customerLedgers').findAll({}).filter(l => l.customerId === req.params.id);
  
  if (from) ledgers = ledgers.filter(l => l.date >= from);
  if (to) ledgers = ledgers.filter(l => l.date <= to + 'T23:59:59.999Z');
  if (type) ledgers = ledgers.filter(l => l.type === type);

  ledgers.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ success: true, data: ledgers });
}));

// 5. POST /api/v1/customers/:id/due - Manual Due Add
router.post('/:id/due', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { amount, referenceType, referenceId, note } = req.body;
  const customer = DataService.get('customers').findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const dueAmount = parseFloat(amount);
  if (isNaN(dueAmount) || dueAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive amount required' });
  }

  const ledger = DataService.get('customerLedgers').create({
    customerId: customer.id,
    date: new Date().toISOString(),
    type: 'due_added',
    referenceType: referenceType || 'manual',
    referenceId: referenceId || '',
    amount: dueAmount,
    paidAmount: 0,
    dueAmount: dueAmount,
    paymentMethod: '',
    note: note || '',
    createdBy: req.user.name || req.user.email
  });

  const newBalance = (customer.dueBalance || 0) + dueAmount;
  DataService.get('customers').update(customer.id, { dueBalance: newBalance });

  logAudit(req, 'customer_due_added', { customerId: customer.id, amount: dueAmount });
  res.status(201).json({ success: true, message: 'Due added', data: { ledger, newBalance } });
}));

// 6. POST /api/v1/customers/:id/payment - Collect Due Payment
router.post('/:id/payment', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const { amount, paymentMethod, note, allowAdvance } = req.body;
  const customer = DataService.get('customers').findById(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

  const payAmount = parseFloat(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid positive amount required' });
  }

  const currentDue = customer.dueBalance || 0;
  if (!allowAdvance && payAmount > currentDue) {
    return res.status(400).json({ 
      success: false, 
      message: `Payment (${payAmount}) cannot exceed due balance (${currentDue}) unless advance is explicitly allowed.` 
    });
  }

  const ledger = DataService.get('customerLedgers').create({
    customerId: customer.id,
    date: new Date().toISOString(),
    type: 'payment',
    referenceType: 'manual_payment',
    referenceId: '',
    amount: payAmount,
    paidAmount: payAmount,
    dueAmount: 0,
    paymentMethod: paymentMethod || 'cash',
    note: note || '',
    createdBy: req.user.name || req.user.email
  });

  const newBalance = Math.max(0, currentDue - payAmount);
  const newTotalPaid = (customer.totalPaid || 0) + payAmount;
  
  DataService.get('customers').update(customer.id, { 
    dueBalance: newBalance,
    totalPaid: newTotalPaid,
    lastVisitAt: new Date().toISOString()
  });

  logAudit(req, 'customer_payment_collected', { customerId: customer.id, amount: payAmount, paymentMethod });
  res.status(201).json({ success: true, message: 'Payment collected', data: { ledger, newBalance } });
}));

module.exports = router;
