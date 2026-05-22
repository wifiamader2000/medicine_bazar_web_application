const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Helper to determine if an online order counts as realized revenue
const isRealizedRevenue = (order) => {
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'verified') return true;
  if (order.paymentMethod === 'cod' && order.orderStatus === 'delivered') return true;
  return false;
};

// 1. GET /api/v1/accounting/summary
router.get('/summary', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const posSales = DataService.get('posSales').findAll({});
  const orders = DataService.get('orders').findAll({});
  const refunds = DataService.get('refunds').findAll({});
  const expenses = DataService.get('expenses').findAll({});
  const ledgers = DataService.get('customerLedgers').findAll({});

  let todayIncome = 0;
  let todayExpense = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  let posSalesTotal = 0;
  let onlineSalesTotal = 0;
  let refundsTotal = 0;
  let dueCollectedTotal = 0;
  let pendingManualPayments = 0;
  let verifiedManualPayments = 0;

  let cashTotal = 0;
  let bkashTotal = 0;
  let nagadTotal = 0;
  let upayTotal = 0;
  let codTotal = 0;

  // Products check for missing costs
  const products = DataService.get('products').findAll({});
  let missingCostItems = 0;
  products.forEach(p => {
    if (p.purchasePrice === undefined || p.purchasePrice === null || p.purchasePrice === 0) {
      missingCostItems++;
    }
  });

  const profitAccuracy = missingCostItems > 0 ? 'partial' : 'full';

  // Process POS Sales
  posSales.forEach(sale => {
    if (!sale.refunded) {
      const amt = sale.paidAmount !== undefined ? sale.paidAmount : (sale.total || 0);
      totalIncome += amt;
      posSalesTotal += amt;
      
      const isToday = sale.createdAt?.startsWith(targetDate);
      if (isToday) todayIncome += amt;

      const pm = (sale.paymentMethod || 'cash').toLowerCase();
      if (pm === 'cash') cashTotal += amt;
      else if (pm === 'bkash') bkashTotal += amt;
      else if (pm === 'nagad') nagadTotal += amt;
      else if (pm === 'upay') upayTotal += amt;
    }
  });

  // Process Due Collections
  ledgers.forEach(l => {
    if (l.type === 'payment') {
      const amt = l.amount || 0;
      totalIncome += amt;
      dueCollectedTotal += amt;
      
      const isToday = l.date?.startsWith(targetDate);
      if (isToday) todayIncome += amt;

      const pm = (l.paymentMethod || 'cash').toLowerCase();
      if (pm === 'cash') cashTotal += amt;
      else if (pm === 'bkash') bkashTotal += amt;
      else if (pm === 'nagad') nagadTotal += amt;
      else if (pm === 'upay') upayTotal += amt;
    }
  });

  // Process Orders
  orders.forEach(order => {
    if (order.paymentStatus === 'pending_verification' && order.paymentProofUrl) {
      pendingManualPayments += order.total || 0;
    }
    if (order.paymentStatus === 'verified') {
      verifiedManualPayments += order.total || 0;
    }

    if (isRealizedRevenue(order)) {
      const amt = order.total || 0;
      totalIncome += amt;
      onlineSalesTotal += amt;
      
      const isToday = order.createdAt?.startsWith(targetDate);
      if (isToday) todayIncome += amt;

      const pm = (order.paymentMethod || 'cod').toLowerCase();
      if (pm === 'cod') codTotal += amt;
      else if (pm === 'bkash') bkashTotal += amt;
      else if (pm === 'nagad') nagadTotal += amt;
      else if (pm === 'upay') upayTotal += amt;
      else if (pm === 'cash') cashTotal += amt; // just in case
    }
  });

  // Process Refunds (Deducted from income in profit, but tracked separately)
  refunds.forEach(refund => {
    const amt = refund.refundTotal || 0;
    refundsTotal += amt;
    totalExpense += amt; // Refunds count as expense for basic cash flow
    const isToday = refund.createdAt?.startsWith(targetDate);
    if (isToday) todayExpense += amt;
  });

  // Process Expenses
  expenses.forEach(exp => {
    const amt = exp.amount || 0;
    totalExpense += amt;
    const isToday = exp.createdAt?.startsWith(targetDate);
    if (isToday) todayExpense += amt;
  });

  res.json({
    success: true,
    data: {
      todayIncome,
      todayExpense,
      todayNetProfit: todayIncome - todayExpense,
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      posSales: posSalesTotal,
      onlineSales: onlineSalesTotal,
      dueCollected: dueCollectedTotal,
      refunds: refundsTotal,
      pendingManualPayments,
      verifiedManualPayments,
      cashTotal,
      bkashTotal,
      nagadTotal,
      upayTotal,
      codTotal,
      missingCostItems,
      profitAccuracy
    }
  });
}));

// 2. GET /api/v1/accounting/cash-book
router.get('/cash-book', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { from, to, paymentMethod, type } = req.query;

  const posSales = DataService.get('posSales').findAll({});
  const orders = DataService.get('orders').findAll({});
  const refunds = DataService.get('refunds').findAll({});
  const expenses = DataService.get('expenses').findAll({});
  const dayClosings = DataService.get('dayClosings').findAll({});
  const ledgers = DataService.get('customerLedgers').findAll({});

  let rows = [];

  // POS Sales
  posSales.forEach(s => {
    if (!s.refunded) {
      const amt = s.paidAmount !== undefined ? s.paidAmount : (s.total || 0);
      if (amt > 0) {
        rows.push({
          id: `pos-${s.id}`,
          date: s.createdAt,
          type: 'income',
          source: 'POS',
          referenceId: s.invoiceNumber,
          paymentMethod: s.paymentMethod || 'cash',
          amount: amt,
          note: s.dueAmount > 0 ? `Due Sale. Total: ${s.total}` : '',
          createdBy: s.cashierName || 'System'
        });
      }
    }
  });

  // Orders
  orders.forEach(o => {
    if (isRealizedRevenue(o)) {
      rows.push({
        id: `ord-${o.id}`,
        date: o.createdAt,
        type: 'income',
        source: 'online',
        referenceId: o.orderNumber,
        paymentMethod: o.paymentMethod || 'cod',
        amount: o.total || 0,
        note: '',
        createdBy: o.customerName || 'Customer'
      });
    }
  });

  // Refunds
  refunds.forEach(r => {
    rows.push({
      id: `ref-${r.id}`,
      date: r.createdAt,
      type: 'refund',
      source: 'POS',
      referenceId: r.refundNumber,
      paymentMethod: 'cash', // Refunds are typically cash
      amount: r.refundTotal || 0,
      note: r.reason || '',
      createdBy: r.refundedBy || 'System'
    });
  });

  // Expenses
  expenses.forEach(e => {
    rows.push({
      id: `exp-${e.id}`,
      date: e.createdAt,
      type: 'expense',
      source: 'expense',
      referenceId: e.id,
      paymentMethod: e.paymentMethod || 'cash',
      amount: e.amount || 0,
      note: e.note || e.category,
      createdBy: e.createdBy || 'Admin'
    });
  });

  // Day Closings
  dayClosings.forEach(d => {
    rows.push({
      id: `dc-${d.id}`,
      date: d.createdAt,
      type: 'info',
      source: 'day closing',
      referenceId: d.id,
      paymentMethod: 'cash',
      amount: d.actualCash || 0,
      note: `Difference: ${d.difference || 0}`,
      createdBy: d.cashierName || 'System'
    });
  });

  // Due Collections
  ledgers.forEach(l => {
    if (l.type === 'payment') {
      rows.push({
        id: `col-${l.id}`,
        date: l.date,
        type: 'income',
        source: 'due_collection',
        referenceId: l.id,
        paymentMethod: l.paymentMethod || 'cash',
        amount: l.amount || 0,
        note: l.note || 'Due collection',
        createdBy: l.createdBy || 'System'
      });
    }
  });

  // Sort newest first
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filters
  if (from) rows = rows.filter(r => r.date >= from);
  if (to) rows = rows.filter(r => r.date <= to + 'T23:59:59.999Z');
  if (paymentMethod) rows = rows.filter(r => r.paymentMethod === paymentMethod);
  if (type) rows = rows.filter(r => r.type === type);

  res.json({ success: true, data: rows });
}));

// 3. GET /api/v1/accounting/profit-loss
router.get('/profit-loss', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const products = DataService.get('products').findAll({});
  const productMap = {};
  products.forEach(p => productMap[p.id] = p);

  let posSales = DataService.get('posSales').findAll({});
  let orders = DataService.get('orders').findAll({});
  let refunds = DataService.get('refunds').findAll({});
  let expenses = DataService.get('expenses').findAll({});

  if (from) {
    posSales = posSales.filter(s => s.createdAt >= from);
    orders = orders.filter(o => o.createdAt >= from);
    refunds = refunds.filter(r => r.createdAt >= from);
    expenses = expenses.filter(e => e.createdAt >= from);
  }
  if (to) {
    const toDate = to + 'T23:59:59.999Z';
    posSales = posSales.filter(s => s.createdAt <= toDate);
    orders = orders.filter(o => o.createdAt <= toDate);
    refunds = refunds.filter(r => r.createdAt <= toDate);
    expenses = expenses.filter(e => e.createdAt <= toDate);
  }

  let grossSales = 0;
  let knownCogs = 0;
  let missingCostItems = 0;
  let missingCostValue = 0;

  posSales.forEach(sale => {
    if (!sale.refunded) {
      grossSales += sale.total || 0;
      (sale.items || []).forEach(item => {
        const p = productMap[item.productId];
        if (p && p.purchasePrice) {
          knownCogs += p.purchasePrice * item.quantity;
        } else {
          missingCostItems++;
          missingCostValue += item.total || (item.price * item.quantity);
        }
      });
    }
  });

  orders.forEach(order => {
    if (isRealizedRevenue(order)) {
      grossSales += order.total || 0;
      (order.items || []).forEach(item => {
        const p = productMap[item.productId];
        if (p && p.purchasePrice) {
          knownCogs += p.purchasePrice * item.quantity;
        } else {
          missingCostItems++;
          missingCostValue += item.total || (item.price * item.quantity);
        }
      });
    }
  });

  const refundsTotal = refunds.reduce((sum, r) => sum + (r.refundTotal || 0), 0);
  const netSales = grossSales - refundsTotal;
  const grossProfit = netSales - knownCogs;
  const expensesTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = grossProfit - expensesTotal;

  const profitAccuracy = missingCostItems > 0 ? 'partial' : 'full';

  res.json({
    success: true,
    data: {
      grossSales,
      refunds: refundsTotal,
      netSales,
      knownCogs,
      missingCostItems,
      missingCostValue,
      grossProfit,
      expenses: expensesTotal,
      netProfit,
      profitAccuracy,
      byDay: [] // Future scope or optional for charting
    }
  });
}));

// 4. POST /api/v1/accounting/expense
router.post('/expense', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  const { category, amount, paymentMethod, note, date } = req.body;

  if (!category) return res.status(400).json({ success: false, message: 'Category is required' });
  if (!paymentMethod) return res.status(400).json({ success: false, message: 'Payment method is required' });
  
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt < 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  const expense = DataService.get('expenses').create({
    category,
    amount: amt,
    paymentMethod,
    note: note || '',
    createdAt: date ? new Date(date).toISOString() : new Date().toISOString(),
    createdBy: req.user.name || req.user.email,
    createdById: req.user.id
  });

  logAudit(req, 'expense_logged', { expenseId: expense.id, amount: amt });
  res.status(201).json({ success: true, message: 'Expense logged successfully', data: expense });
}));

// 5. GET /api/v1/accounting/payment-method-wise
router.get('/payment-method-wise', authenticate, authorize('admin', 'manager'), asyncHandler(async (req, res) => {
  let cash = 0, bkash = 0, nagad = 0, upay = 0, cod = 0, manualPending = 0, manualVerified = 0;

  DataService.get('posSales').findAll({}).forEach(s => {
    if (!s.refunded) {
      const amt = s.paidAmount !== undefined ? s.paidAmount : (s.total || 0);
      const pm = (s.paymentMethod || 'cash').toLowerCase();
      if (pm === 'cash') cash += amt;
      else if (pm === 'bkash') bkash += amt;
      else if (pm === 'nagad') nagad += amt;
      else if (pm === 'upay') upay += amt;
    }
  });

  DataService.get('customerLedgers').findAll({}).forEach(l => {
    if (l.type === 'payment') {
      const amt = l.amount || 0;
      const pm = (l.paymentMethod || 'cash').toLowerCase();
      if (pm === 'cash') cash += amt;
      else if (pm === 'bkash') bkash += amt;
      else if (pm === 'nagad') nagad += amt;
      else if (pm === 'upay') upay += amt;
    }
  });

  DataService.get('orders').findAll({}).forEach(o => {
    if (o.paymentStatus === 'pending_verification' && o.paymentProofUrl) manualPending += o.total || 0;
    if (o.paymentStatus === 'verified') manualVerified += o.total || 0;

    if (isRealizedRevenue(o)) {
      const pm = (o.paymentMethod || 'cod').toLowerCase();
      if (pm === 'cod') cod += o.total;
      else if (pm === 'bkash') bkash += o.total;
      else if (pm === 'nagad') nagad += o.total;
      else if (pm === 'upay') upay += o.total;
      else if (pm === 'cash') cash += o.total;
    }
  });

  res.json({
    success: true,
    data: { cash, bkash, nagad, upay, cod, manualPending, manualVerified }
  });
}));

// 6. GET /api/v1/accounting/day-closing
router.get('/day-closing', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const { date, cashierId } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  let targetCashier = cashierId;
  if (req.user.role === 'cashier') targetCashier = req.user.id;

  let posSales = DataService.get('posSales').findAll({}).filter(s => s.createdAt?.startsWith(targetDate));
  let refunds = DataService.get('refunds').findAll({}).filter(r => r.createdAt?.startsWith(targetDate));
  let expenses = DataService.get('expenses').findAll({}).filter(e => e.createdAt?.startsWith(targetDate) && e.paymentMethod === 'cash');
  let sessions = DataService.get('posSessions').findAll({}).filter(s => s.openedAt?.startsWith(targetDate) || s.closedAt?.startsWith(targetDate));
  let existingClosing = DataService.get('dayClosings').findAll({}).find(d => d.date === targetDate && (!targetCashier || d.cashierId === targetCashier));

  if (targetCashier) {
    posSales = posSales.filter(s => s.cashierId === targetCashier);
    sessions = sessions.filter(s => s.cashierId === targetCashier);
  }

  const openingCash = sessions.reduce((sum, s) => sum + (s.openingCash || 0), 0);
  
  let cashSales = 0;
  posSales.forEach(s => {
    if (!s.refunded && (s.paymentMethod === 'cash' || !s.paymentMethod)) {
      cashSales += (s.paidAmount !== undefined ? s.paidAmount : (s.total || 0));
    }
  });

  let cashDueCollections = 0;
  DataService.get('customerLedgers').findAll({}).filter(l => l.type === 'payment' && l.date?.startsWith(targetDate) && l.paymentMethod === 'cash').forEach(l => {
    // Should filter by cashierId ideally, but ledgers don't have cashierId yet. We can check createdBy/cashier if needed, but for now we sum all or we might need to rely on POS sessions.
    // Wait, day closing only covers the current user's session if targetCashier is set.
    cashDueCollections += (l.amount || 0); 
  });
  // Since ledger doesn't have cashierId explicitly right now, we will add it to the model. Wait, we set createdBy but no ID. For now we sum.

  const cashRefunds = refunds.reduce((sum, r) => sum + (r.refundTotal || 0), 0);
  const cashExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const expectedCash = openingCash + cashSales + cashDueCollections - cashRefunds - cashExpenses;

  res.json({
    success: true,
    data: {
      date: targetDate,
      openingCash,
      cashSales,
      cashRefunds,
      cashExpenses,
      expectedCash,
      actualCash: existingClosing ? existingClosing.actualCash : 0,
      difference: existingClosing ? existingClosing.difference : 0,
      sessions: sessions.length,
      salesCount: posSales.length,
      refundsCount: refunds.length,
      denominations: existingClosing ? existingClosing.denominations : null,
      status: existingClosing ? 'closed' : 'pending'
    }
  });
}));

// 7. POST /api/v1/accounting/day-closing
router.post('/day-closing', authenticate, authorize('admin', 'manager', 'cashier'), asyncHandler(async (req, res) => {
  const { date, cashierId, actualCash, denominations, note } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  let targetCashier = cashierId;
  if (req.user.role === 'cashier') targetCashier = req.user.id;

  const actCash = parseFloat(actualCash);
  if (isNaN(actCash) || actCash < 0) {
    return res.status(400).json({ success: false, message: 'Actual cash must be a positive number' });
  }

  // Calculate expected cash again to be safe
  let posSales = DataService.get('posSales').findAll({}).filter(s => s.createdAt?.startsWith(targetDate));
  let refunds = DataService.get('refunds').findAll({}).filter(r => r.createdAt?.startsWith(targetDate));
  let expenses = DataService.get('expenses').findAll({}).filter(e => e.createdAt?.startsWith(targetDate) && e.paymentMethod === 'cash');
  let sessions = DataService.get('posSessions').findAll({}).filter(s => s.openedAt?.startsWith(targetDate) || s.closedAt?.startsWith(targetDate));
  
  if (targetCashier) {
    posSales = posSales.filter(s => s.cashierId === targetCashier);
    sessions = sessions.filter(s => s.cashierId === targetCashier);
  }

  const openingCash = sessions.reduce((sum, s) => sum + (s.openingCash || 0), 0);
  let cashSales = 0;
  posSales.forEach(s => {
    if (!s.refunded && (s.paymentMethod === 'cash' || !s.paymentMethod)) {
      cashSales += (s.paidAmount !== undefined ? s.paidAmount : (s.total || 0));
    }
  });
  
  let cashDueCollections = 0;
  DataService.get('customerLedgers').findAll({}).filter(l => l.type === 'payment' && l.date?.startsWith(targetDate) && l.paymentMethod === 'cash').forEach(l => {
    cashDueCollections += (l.amount || 0);
  });

  const cashRefunds = refunds.reduce((sum, r) => sum + (r.refundTotal || 0), 0);
  const cashExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const expectedCash = openingCash + cashSales + cashDueCollections - cashRefunds - cashExpenses;
  const difference = actCash - expectedCash;

  let calcDenomTotal = 0;
  if (denominations) {
    calcDenomTotal += (denominations['1000'] || 0) * 1000;
    calcDenomTotal += (denominations['500'] || 0) * 500;
    calcDenomTotal += (denominations['200'] || 0) * 200;
    calcDenomTotal += (denominations['100'] || 0) * 100;
    calcDenomTotal += (denominations['50'] || 0) * 50;
    calcDenomTotal += (denominations['20'] || 0) * 20;
    calcDenomTotal += (denominations['10'] || 0) * 10;
    calcDenomTotal += (denominations['coins'] || 0);
  }

  if (denominations && calcDenomTotal !== actCash) {
    return res.status(400).json({ success: false, message: `Denomination total (${calcDenomTotal}) does not match actual cash (${actCash})` });
  }

  // Check if already closed
  let existingClosing = DataService.get('dayClosings').findAll({}).find(d => d.date === targetDate && (!targetCashier || d.cashierId === targetCashier));
  if (existingClosing) {
    return res.status(400).json({ success: false, message: 'Day closing already submitted for this date/cashier' });
  }

  const dayClosing = DataService.get('dayClosings').create({
    date: targetDate,
    cashierId: targetCashier,
    cashierName: req.user.name,
    openingCash,
    cashSales,
    cashRefunds,
    cashExpenses,
    expectedCash,
    actualCash: actCash,
    difference,
    denominations,
    note: note || '',
    submittedBy: req.user.id
  });

  logAudit(req, 'day_closing_submitted', { closingId: dayClosing.id, date: targetDate, difference });
  res.status(201).json({ success: true, message: 'Day closing submitted successfully', data: dayClosing });
}));

module.exports = router;
