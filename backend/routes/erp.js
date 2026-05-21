const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Get daily sales
router.get('/daily-sales', authenticate, adminOnly, async (req, res) => {
  try {
    const orders = await DataService.get('orders').find({ paymentStatus: 'paid' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todaySales = 0;
    let todayOrdersCount = 0;
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.timestamp);
      if (orderDate >= today) {
        todaySales += order.total;
        todayOrdersCount++;
      }
    });
    
    res.json({ success: true, todaySales, todayOrdersCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get profit/loss summary
router.get('/summary', authenticate, adminOnly, async (req, res) => {
  try {
    const orders = await DataService.get('orders').find({ paymentStatus: 'paid' });
    const transactions = await DataService.get('transactions').find() || [];
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Add orders to income (assuming basic model, can be refined)
    orders.forEach(order => {
      totalIncome += order.total;
    });
    
    // Process explicit transactions (e.g. expenses)
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
    });
    
    res.json({ 
      success: true, 
      totalIncome, 
      totalExpense, 
      profit: totalIncome - totalExpense 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post a transaction (Stock purchase, utility bill, etc)
router.post('/transactions', authenticate, adminOnly, async (req, res) => {
  try {
    const { amount, type, category, description, referenceId, paymentMethod } = req.body;
    
    const transaction = {
      amount: parseFloat(amount),
      type,
      category,
      description,
      referenceId,
      paymentMethod,
      recordedBy: req.user.id,
      date: new Date().toISOString()
    };
    
    const saved = await DataService.get('transactions').create(transaction);
    res.json({ success: true, transaction: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
