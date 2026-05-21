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

// === SUPPLIER LEDGER SYSTEM ===

// Get all suppliers
router.get('/suppliers', authenticate, adminOnly, async (req, res) => {
  try {
    const suppliers = await DataService.get('suppliers').findAll() || [];
    res.json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new supplier
router.post('/suppliers', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, companyName, phone, email, address, dueBalance } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }
    const newSupplier = {
      name,
      companyName: companyName || '',
      phone: phone || '',
      email: email || '',
      address: address || '',
      dueBalance: parseFloat(dueBalance) || 0
    };
    const saved = await DataService.get('suppliers').create(newSupplier);
    res.json({ success: true, supplier: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update supplier details
router.put('/suppliers/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, companyName, phone, email, address, dueBalance } = req.body;
    const supplier = await DataService.get('suppliers').findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const updatedData = {
      name: name !== undefined ? name : supplier.name,
      companyName: companyName !== undefined ? companyName : supplier.companyName,
      phone: phone !== undefined ? phone : supplier.phone,
      email: email !== undefined ? email : supplier.email,
      address: address !== undefined ? address : supplier.address,
      dueBalance: dueBalance !== undefined ? parseFloat(dueBalance) || 0 : supplier.dueBalance
    };
    const updated = await DataService.get('suppliers').update(id, updatedData);
    res.json({ success: true, supplier: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete supplier
router.delete('/suppliers/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DataService.get('suppliers').delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get supplier ledger history
router.get('/suppliers/:id/ledger', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await DataService.get('suppliers').findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    const allPurchaseOrders = await DataService.get('purchaseOrders').findAll() || [];
    const ledger = allPurchaseOrders
      .filter(po => po.supplierId === id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
      
    res.json({ success: true, supplier, ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record a supplier purchase order or payment transaction
router.post('/suppliers/:id/ledger', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, paymentMethod, description, referenceNumber } = req.body;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    if (!['purchase', 'payment'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type (must be purchase or payment)' });
    }

    const supplier = await DataService.get('suppliers').findById(id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Save purchase order entry
    const purchaseOrder = {
      supplierId: id,
      supplierName: supplier.name,
      type,
      amount: parsedAmount,
      paymentMethod: paymentMethod || 'cash',
      date: new Date().toISOString(),
      description: description || '',
      referenceNumber: referenceNumber || '',
      recordedBy: req.user.id
    };

    const savedPO = await DataService.get('purchaseOrders').create(purchaseOrder);

    // Update supplier due balance
    let newDue = supplier.dueBalance || 0;
    if (type === 'purchase') {
      newDue += parsedAmount;
    } else if (type === 'payment') {
      newDue -= parsedAmount;
      
      // Auto-log to central transactions as expense
      await DataService.get('transactions').create({
        amount: parsedAmount,
        type: 'expense',
        category: 'Supplier Payment',
        description: `Payment to Supplier: ${supplier.name}. Ref: ${referenceNumber || 'N/A'}. ${description || ''}`,
        referenceId: savedPO.id,
        paymentMethod: paymentMethod || 'cash',
        recordedBy: req.user.id,
        date: new Date().toISOString()
      });
    }

    const updatedSupplier = await DataService.get('suppliers').update(id, { dueBalance: newDue });

    res.json({ success: true, purchaseOrder: savedPO, supplier: updatedSupplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
