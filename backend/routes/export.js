const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ExportService = require('../services/ExportService');
const { buildAccountingSummary } = require('./accounting');

// Protect all export routes for Admin/Manager
router.use(authenticate);
router.use(authorize('admin', 'manager'));

/**
 * Common handler for CSV vs JSON response
 */
const handleExportResponse = (req, res, filename, rows, columns) => {
  if (req.query.format === 'csv') {
    ExportService.sendCSV(res, filename, rows, columns);
  } else {
    res.json({ success: true, data: rows });
  }
};

/**
 * @route   GET /api/v1/export/daily-report
 * @desc    Export daily sales, expenses, and cash flow
 * @access  Private (Admin/Manager)
 */
router.get('/daily-report', async (req, res) => {
  try {
    const dateQuery = req.query.date || new Date().toISOString().split('T')[0];
    const rows = await ExportService.buildDailyReport(dateQuery);
    const columns = [
      { key: 'type', label: 'Transaction Type' },
      { key: 'id', label: 'ID/Invoice' },
      { key: 'time', label: 'Time' },
      { key: 'amount', label: 'Amount' },
      { key: 'method', label: 'Method' },
      { key: 'note', label: 'Note' }
    ];
    handleExportResponse(req, res, `daily_report_${dateQuery}.csv`, rows, columns);
  } catch (error) {
    console.error('Export Error (daily-report):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   GET /api/v1/export/monthly-report
 * @desc    Export monthly sales breakdown
 * @access  Private (Admin/Manager)
 */
router.get('/monthly-report', async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const rows = await ExportService.buildMonthlyReport(month, year);
    
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'posSales', label: 'POS Sales' },
      { key: 'onlineSales', label: 'Online Sales' },
      { key: 'expenses', label: 'Expenses' },
      { key: 'net', label: 'Net Amount' }
    ];
    handleExportResponse(req, res, `monthly_report_${year}_${month}.csv`, rows, columns);
  } catch (error) {
    console.error('Export Error (monthly-report):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   GET /api/v1/export/accounting
 * @desc    Export accounting summary (Cash book, profit/loss)
 * @access  Private (Admin/Manager)
 */
router.get('/accounting', async (req, res) => {
  try {
    // We can reuse the buildAccountingSummary logic from Phase 2
    // It returns the summary object, which we convert to an array of rows
    const summary = await buildAccountingSummary(req.query.from, req.query.to);
    
    const rows = [
      { category: 'Total Income', amount: summary.totalIncome },
      { category: 'Total COGS (Estimated)', amount: summary.totalCost },
      { category: 'Gross Profit', amount: summary.grossProfit },
      { category: 'Total Expense', amount: summary.totalExpense },
      { category: 'Net Profit', amount: summary.netProfit }
    ];

    const columns = [
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' }
    ];

    handleExportResponse(req, res, `accounting_summary.csv`, rows, columns);
  } catch (error) {
    console.error('Export Error (accounting):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   GET /api/v1/export/stock
 * @desc    Export stock data (filters: lowStockOnly, outOfStockOnly)
 * @access  Private (Admin/Manager)
 */
router.get('/stock', async (req, res) => {
  try {
    const rows = await ExportService.buildStockReport(
      req.query.lowStockOnly === 'true',
      req.query.outOfStockOnly === 'true'
    );
    const columns = [
      { key: 'name', label: 'Product Name' },
      { key: 'generic', label: 'Generic Name' },
      { key: 'manufacturer', label: 'Manufacturer' },
      { key: 'category', label: 'Category' },
      { key: 'stock', label: 'Stock Quantity' },
      { key: 'purchasePrice', label: 'Purchase Price' },
      { key: 'sellingPrice', label: 'Selling Price' },
      { key: 'stockValue', label: 'Total Stock Value' }
    ];
    handleExportResponse(req, res, 'stock_report.csv', rows, columns);
  } catch (error) {
    console.error('Export Error (stock):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   GET /api/v1/export/expiry
 * @desc    Export near expiry products
 * @access  Private (Admin/Manager)
 */
router.get('/expiry', async (req, res) => {
  try {
    const days = parseInt(req.query.withinDays) || 30;
    const rows = await ExportService.buildExpiryReport(days);
    const columns = [
      { key: 'name', label: 'Product Name' },
      { key: 'batch', label: 'Batch' },
      { key: 'expiryDate', label: 'Expiry Date' },
      { key: 'stock', label: 'Stock' },
      { key: 'supplier', label: 'Supplier' }
    ];
    handleExportResponse(req, res, `expiry_report_${days}days.csv`, rows, columns);
  } catch (error) {
    console.error('Export Error (expiry):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   GET /api/v1/export/customer-due
 * @desc    Export customer due balances
 * @access  Private (Admin/Manager)
 */
router.get('/customer-due', async (req, res) => {
  try {
    const rows = await ExportService.buildCustomerDueReport(req.query.dueOnly === 'true');
    const columns = [
      { key: 'name', label: 'Customer Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'type', label: 'Customer Type' },
      { key: 'totalPurchase', label: 'Total Purchase' },
      { key: 'totalPaid', label: 'Total Paid' },
      { key: 'dueBalance', label: 'Due Balance' },
      { key: 'lastVisit', label: 'Last Visit' }
    ];
    handleExportResponse(req, res, 'customer_due_report.csv', rows, columns);
  } catch (error) {
    console.error('Export Error (customer-due):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   GET /api/v1/export/payments
 * @desc    Export payment records
 * @access  Private (Admin/Manager)
 */
router.get('/payments', async (req, res) => {
  try {
    const rows = await ExportService.buildPaymentReport(req.query.status);
    const columns = [
      { key: 'orderId', label: 'Order ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'method', label: 'Payment Method' },
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' }
    ];
    handleExportResponse(req, res, 'payment_verification_report.csv', rows, columns);
  } catch (error) {
    console.error('Export Error (payments):', error);
    res.status(500).json({ success: false, message: 'Failed to generate export' });
  }
});

/**
 * @route   POST /api/v1/export/google-sheets
 * @desc    Placeholder for pushing export to Google Sheets
 * @access  Private (Admin/Manager)
 */
router.post('/google-sheets', async (req, res) => {
  try {
    // We intentionally return a static error since credentials are not yet configured.
    // We do NOT fake a success response.
    return res.status(400).json({
      success: false,
      message: 'Google Sheets integration is not configured.'
    });
  } catch (error) {
    console.error('Export Error (google-sheets):', error);
    res.status(500).json({ success: false, message: 'Failed to initiate Google Sheets export' });
  }
});

module.exports = router;
