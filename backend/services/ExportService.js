const DataService = require('./DataService');

/**
 * ExportService
 * Generates CSV content from data arrays and handles safe data extraction.
 * Includes UTF-8 BOM for Excel compatibility with Bangla text.
 */
class ExportService {
  /**
   * Convert an array of objects to a CSV string.
   * @param {Array<Object>} rows - Data rows
   * @param {Array<Object>} columns - Array of { key: 'field_name', label: 'Column Header' }
   * @returns {string} CSV string including UTF-8 BOM
   */
  static toCSV(rows, columns) {
    if (!rows || !columns || columns.length === 0) {
      return '';
    }

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // If the string contains comma, newline, or double-quote, it must be enclosed in double quotes.
      // Double quotes inside the string must be escaped as two double quotes.
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Header row
    const headerRow = columns.map(col => escapeCSV(col.label)).join(',');
    
    // Data rows
    const dataRows = rows.map(row => {
      return columns.map(col => {
        // Handle nested properties (e.g. 'customer.name') by reducing or just accessing directly if flat
        const value = row[col.key];
        return escapeCSV(value);
      }).join(',');
    });

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    return BOM + [headerRow, ...dataRows].join('\n');
  }

  /**
   * Send CSV response to Express res object
   */
  static sendCSV(res, filename, rows, columns) {
    const csvContent = this.toCSV(rows, columns);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  }

  // --- Builders for specific reports ---

  static async buildDailyReport(dateStr) {
    const dateQuery = dateStr ? new Date(dateStr) : new Date();
    dateQuery.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateQuery);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch data via DataService
    const filterByDate = (item) => {
      const d = new Date(item.createdAt || item.date);
      return d >= dateQuery && d <= endOfDay;
    };

    const [posSales, orders, refunds, expenses, dayClosings, ledgers] = await Promise.all([
      DataService.getCollection('posSales'),
      DataService.getCollection('orders'),
      DataService.getCollection('refunds'),
      DataService.getCollection('expenses'),
      DataService.getCollection('dayClosings'),
      DataService.getCollection('customerLedgers')
    ]);

    const dailyPos = posSales.filter(filterByDate);
    const dailyOrders = orders.filter(filterByDate);
    const dailyRefunds = refunds.filter(filterByDate);
    const dailyExpenses = expenses.filter(filterByDate);
    
    // Payments logic (similar to accounting)
    const dueCollections = ledgers.filter(l => l.type === 'payment' && filterByDate(l));
    
    const rows = [];
    
    // POS Sales
    dailyPos.forEach(sale => {
      rows.push({
        type: 'POS Sale',
        id: sale.invoiceNumber || sale.id,
        time: new Date(sale.createdAt).toLocaleTimeString(),
        amount: sale.paidAmount || sale.tenderedAmount || sale.total || 0, // Using paidAmount as per Phase 3 rules
        method: sale.paymentMethod || 'cash',
        note: `Total: ${sale.total}, Due: ${sale.dueAmount || 0}`
      });
    });

    // Online Orders
    dailyOrders.filter(o => o.paymentStatus === 'paid' || o.paymentStatus === 'verified' || (o.paymentMethod === 'cod' && o.orderStatus === 'delivered')).forEach(order => {
      rows.push({
        type: 'Online Order',
        id: order.orderNumber || order.id,
        time: new Date(order.createdAt).toLocaleTimeString(),
        amount: order.total,
        method: order.paymentMethod,
        note: `Status: ${order.orderStatus}`
      });
    });

    // Due Collections
    dueCollections.forEach(payment => {
      rows.push({
        type: 'Due Collection',
        id: payment.id,
        time: new Date(payment.createdAt).toLocaleTimeString(),
        amount: payment.amount,
        method: payment.paymentMethod || 'cash',
        note: `Customer ID: ${payment.customerId}`
      });
    });

    // Refunds
    dailyRefunds.forEach(refund => {
      rows.push({
        type: 'Refund',
        id: refund.id,
        time: new Date(refund.createdAt).toLocaleTimeString(),
        amount: -refund.amount,
        method: refund.refundMethod,
        note: refund.reason
      });
    });

    // Expenses
    dailyExpenses.forEach(expense => {
      rows.push({
        type: 'Expense',
        id: expense.id,
        time: new Date(expense.date).toLocaleTimeString(),
        amount: -expense.amount,
        method: 'cash',
        note: `${expense.category} - ${expense.description}`
      });
    });

    return rows;
  }

  static async buildMonthlyReport(month, year) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const filterByDate = (item) => {
      const d = new Date(item.createdAt || item.date);
      return d >= startOfMonth && d <= endOfMonth;
    };

    const [posSales, orders, expenses] = await Promise.all([
      DataService.getCollection('posSales'),
      DataService.getCollection('orders'),
      DataService.getCollection('expenses')
    ]);

    const monthPos = posSales.filter(filterByDate);
    const monthOrders = orders.filter(filterByDate);
    const monthExpenses = expenses.filter(filterByDate);

    // Group by day
    const dailyMap = {};
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      dailyMap[i] = { date: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`, posSales: 0, onlineSales: 0, expenses: 0 };
    }

    monthPos.forEach(sale => {
      const day = new Date(sale.createdAt).getDate();
      dailyMap[day].posSales += (sale.paidAmount || sale.tenderedAmount || sale.total || 0);
    });

    monthOrders.forEach(order => {
      if (order.paymentStatus === 'paid' || order.paymentStatus === 'verified' || (order.paymentMethod === 'cod' && order.orderStatus === 'delivered')) {
        const day = new Date(order.createdAt).getDate();
        dailyMap[day].onlineSales += order.total;
      }
    });

    monthExpenses.forEach(expense => {
      const day = new Date(expense.date).getDate();
      dailyMap[day].expenses += expense.amount;
    });

    return Object.values(dailyMap).map(day => ({
      ...day,
      net: day.posSales + day.onlineSales - day.expenses
    }));
  }

  static async buildStockReport(lowStockOnly = false, outOfStockOnly = false) {
    const products = await DataService.getCollection('products');
    
    let filtered = products;
    if (outOfStockOnly) {
      filtered = products.filter(p => p.stock === 0);
    } else if (lowStockOnly) {
      filtered = products.filter(p => p.stock > 0 && p.stock <= 10); // arbitrary low stock threshold for now
    }

    return filtered.map(p => ({
      name: p.name,
      generic: p.genericName || '',
      manufacturer: p.manufacturer || '',
      category: p.category || '',
      stock: p.stock || 0,
      purchasePrice: p.purchasePrice || 0,
      sellingPrice: p.price || 0,
      stockValue: (p.stock || 0) * (p.purchasePrice || 0)
    }));
  }

  static async buildExpiryReport(withinDays = 30) {
    const products = await DataService.getCollection('products');
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(withinDays));

    const expiring = products.filter(p => {
      if (!p.expiryDate) return false;
      const expDate = new Date(p.expiryDate);
      return expDate <= targetDate && expDate >= new Date();
    });

    return expiring.map(p => ({
      name: p.name,
      batch: p.batchNumber || '',
      expiryDate: new Date(p.expiryDate).toLocaleDateString(),
      stock: p.stock || 0,
      supplier: p.supplier || ''
    }));
  }

  static async buildCustomerDueReport(dueOnly = false) {
    const customers = await DataService.getCollection('customers');
    
    let filtered = customers;
    if (dueOnly) {
      filtered = customers.filter(c => c.dueBalance > 0);
    }

    return filtered.map(c => ({
      name: c.name || 'Walk-in',
      phone: c.phone || '',
      type: c.customerType || '',
      totalPurchase: c.totalPurchaseAmount || 0,
      totalPaid: c.totalPaidAmount || 0,
      dueBalance: c.dueBalance || 0,
      lastVisit: c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A'
    }));
  }

  static async buildPaymentReport(statusFilter = '') {
    const orders = await DataService.getCollection('orders');
    
    let filtered = orders.filter(o => o.paymentMethod !== 'cod'); // typically track online payments here
    if (statusFilter) {
      filtered = filtered.filter(o => o.paymentStatus === statusFilter);
    }

    return filtered.map(o => ({
      orderId: o.orderNumber || o.id,
      customer: o.userPhone || o.customerName || 'N/A',
      method: o.paymentMethod,
      transactionId: o.transactionId || 'N/A',
      amount: o.total,
      status: o.paymentStatus || 'pending',
      date: new Date(o.createdAt).toLocaleString()
    }));
  }
}

module.exports = ExportService;
