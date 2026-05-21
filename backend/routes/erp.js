const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const DataService = require('../services/DataService');

// Get daily sales
router.get('/daily-sales', authenticate, adminOnly, async (req, res) => {
  try {
    const orders = await DataService.get('orders').find({ paymentStatus: 'paid' }) || [];
    const posSales = await DataService.get('posSales').find() || [];
    const refunds = await DataService.get('refunds').find() || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todaySales = 0;
    let todayOrdersCount = 0;
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt || order.timestamp);
      if (orderDate >= today) {
        todaySales += (order.total || 0);
        todayOrdersCount++;
      }
    });

    posSales.forEach(sale => {
      const saleDate = new Date(sale.createdAt || sale.timestamp);
      if (saleDate >= today) {
        todaySales += (sale.total || 0);
        todayOrdersCount++;
      }
    });

    refunds.forEach(refund => {
      const refundDate = new Date(refund.createdAt || refund.timestamp);
      if (refundDate >= today) {
        todaySales -= (refund.refundTotal || 0);
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
    const orders = await DataService.get('orders').find({ paymentStatus: 'paid' }) || [];
    const posSales = await DataService.get('posSales').find() || [];
    const refunds = await DataService.get('refunds').find() || [];
    const transactions = await DataService.get('transactions').find() || [];
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Add online orders to income
    orders.forEach(order => {
      totalIncome += (order.total || 0);
    });

    // Add POS sales to income
    posSales.forEach(sale => {
      totalIncome += (sale.total || 0);
    });

    // Subtract refunds
    refunds.forEach(refund => {
      totalIncome -= (refund.refundTotal || 0);
    });
    
    // Process explicit transactions (e.g. expenses)
    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += (t.amount || 0);
      if (t.type === 'expense') totalExpense += (t.amount || 0);
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
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ success: false, message: 'Invalid or negative amount' });
    }

    const transaction = {
      amount: parsedAmount,
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
