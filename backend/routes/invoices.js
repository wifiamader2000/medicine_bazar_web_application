const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, optionalAuth, logAudit } = require('../middleware/auth');
const DataService = require('../services/DataService');
const config = require('../config');

/**
 * Invoice / Receipt API
 * 
 * Provides invoice data for online orders and POS sales.
 * PDF/thermal rendering is handled on the frontend.
 * Access control:
 *   - customer: own orders only
 *   - cashier: POS receipts only
 *   - admin/manager: all invoices
 */

// Helper: build branding block once
function getBranding() {
  return {
    name: config.branding.siteName,
    nameBn: config.branding.siteNameBn,
    tagline: config.branding.tagline,
    taglineBn: config.branding.taglineBn,
    phone: config.branding.supportPhone,
    whatsapp: config.branding.whatsapp,
    facebook: config.branding.facebook,
  };
}

// Helper: generate invoice number if missing
function ensureInvoiceNumber(record) {
  if (record.invoiceNumber) return record.invoiceNumber;
  if (record.orderNumber) return record.orderNumber;
  return 'INV-' + (record.id || record._id || Date.now().toString(36)).toString().toUpperCase();
}

// ===================================================================
// GET /api/v1/invoices/:orderId/preview
// Returns JSON data for rendering invoice/receipt on frontend
// ===================================================================
router.get('/:orderId/preview', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { type } = req.query; // 'online' | 'pos' - defaults to auto-detect

  let record = null;
  let invoiceType = type || 'auto';

  // Try POS sale first if type is pos or auto
  if (invoiceType === 'pos' || invoiceType === 'auto') {
    record = DataService.get('posSales').findById(orderId);
    if (record) invoiceType = 'pos';
  }

  // Try online order if not found or type is online
  if (!record && (invoiceType === 'online' || invoiceType === 'auto')) {
    record = DataService.get('orders').findById(orderId);
    if (record) invoiceType = 'online';
  }

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Order/sale not found',
      messageBn: 'অর্ডার/সেল পাওয়া যায়নি',
    });
  }

  // Access control
  const userRole = req.user.role;
  const userId = req.user.id;

  if (userRole === 'customer') {
    // Customer can only access their own online orders
    if (invoiceType !== 'online' || record.customerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own invoices',
        messageBn: 'আপনি শুধুমাত্র নিজের ইনভয়েস দেখতে পারেন',
      });
    }
  } else if (userRole === 'cashier') {
    // Cashier can only access POS receipts from their own sessions
    if (invoiceType !== 'pos') {
      return res.status(403).json({
        success: false,
        message: 'Cashiers can only access POS receipts',
        messageBn: 'ক্যাশিয়ার শুধুমাত্র POS রিসিভ দেখতে পারেন',
      });
    }
  }
  // admin and manager can access all

  const invoiceNumber = ensureInvoiceNumber(record);

  const invoiceData = {
    invoiceNumber,
    type: invoiceType,
    branding: getBranding(),
    createdAt: record.createdAt || record.openedAt || new Date().toISOString(),

    // Items
    items: (record.items || []).map(item => ({
      name: item.name || 'Unknown Product',
      nameBn: item.nameBn || '',
      genericName: item.genericName || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'piece',
      price: item.price || 0,
      mrp: item.mrp || item.price || 0,
      total: item.total || (item.price * item.quantity) || 0,
    })),

    // Financials
    subtotal: record.subtotal || 0,
    discount: record.discount || 0,
    deliveryCharge: record.deliveryCharge || 0,
    total: record.total || 0,

    // Payment
    paymentMethod: record.paymentMethod || 'cash',
    paymentStatus: record.paymentStatus || (invoiceType === 'pos' ? 'paid' : 'pending'),
    transactionId: record.transactionId || null,

    // POS specific
    ...(invoiceType === 'pos' && {
      cashierName: record.cashierName || '',
      sessionId: record.sessionId || '',
      customerPhone: record.customerPhone || '',
      tenderedAmount: record.tenderedAmount || null,
      change: record.change || null,
      refunded: record.refunded || false,
      dueAmount: record.dueAmount || 0,
    }),

    // Online specific
    ...(invoiceType === 'online' && {
      orderNumber: record.orderNumber || invoiceNumber,
      customerName: record.customerName || '',
      customerEmail: record.customerEmail || '',
      shippingAddress: record.shippingAddress || null,
      orderStatus: record.orderStatus || 'pending',
      prescriptionId: record.prescriptionId || null,
      note: record.note || '',
    }),
  };

  logAudit(req, 'invoice_preview', { invoiceNumber, type: invoiceType });
  res.json({ success: true, data: invoiceData });
}));

// ===================================================================
// GET /api/v1/invoices/:orderId/pdf
// Returns JSON data formatted for A4 PDF rendering (online orders)
// Actual PDF generation handled on frontend with jsPDF/html2pdf
// ===================================================================
router.get('/:orderId/pdf', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = DataService.get('orders').findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
      messageBn: 'অর্ডার পাওয়া যায়নি',
    });
  }

  // Access control
  if (req.user.role === 'customer' && order.customerId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      messageBn: 'প্রবেশাধিকার নেই',
    });
  }
  if (req.user.role === 'cashier') {
    return res.status(403).json({
      success: false,
      message: 'Cashiers cannot access online order invoices',
      messageBn: 'ক্যাশিয়ার অনলাইন অর্ডার ইনভয়েস দেখতে পারেন না',
    });
  }

  const invoiceNumber = ensureInvoiceNumber(order);

  const pdfData = {
    invoiceNumber,
    type: 'online',
    branding: getBranding(),
    createdAt: order.createdAt,
    orderNumber: order.orderNumber,
    customerName: order.customerName || '',
    customerEmail: order.customerEmail || '',
    shippingAddress: order.shippingAddress || null,
    items: (order.items || []).map(item => ({
      name: item.name || 'Unknown',
      nameBn: item.nameBn || '',
      genericName: item.genericName || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'piece',
      price: item.price || 0,
      mrp: item.mrp || item.price || 0,
      total: item.total || (item.price * item.quantity) || 0,
    })),
    subtotal: order.subtotal || 0,
    discount: order.discount || 0,
    deliveryCharge: order.deliveryCharge || 0,
    total: order.total || 0,
    paymentMethod: order.paymentMethod || 'cod',
    paymentStatus: order.paymentStatus || 'pending',
    orderStatus: order.orderStatus || 'pending',
    note: order.note || '',
    prescriptionId: order.prescriptionId || null,
    disclaimer: 'This is a computer-generated invoice. For prescription medicines, a valid prescription is required.',
    disclaimerBn: 'এটি একটি কম্পিউটার-জেনারেটেড ইনভয়েস। প্রেসক্রিপশন ওষুধের জন্য বৈধ প্রেসক্রিপশন প্রয়োজন।',
  };

  logAudit(req, 'invoice_pdf_request', { invoiceNumber, orderId });
  res.json({ success: true, data: pdfData });
}));

// ===================================================================
// GET /api/v1/invoices/:orderId/thermal
// Returns JSON data formatted for thermal receipt (POS sales)
// ===================================================================
router.get('/:orderId/thermal', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const sale = DataService.get('posSales').findById(orderId);
  if (!sale) {
    return res.status(404).json({
      success: false,
      message: 'POS sale not found',
      messageBn: 'POS সেল পাওয়া যায়নি',
    });
  }

  // Access control: only cashier (own sales) or admin/manager
  if (req.user.role === 'cashier' && sale.cashierId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own POS receipts',
      messageBn: 'আপনি শুধুমাত্র নিজের POS রিসিভ দেখতে পারেন',
    });
  }
  if (req.user.role === 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Customers cannot access POS receipts',
      messageBn: 'কাস্টমার POS রিসিভ দেখতে পারেন না',
    });
  }

  const thermalData = {
    invoiceNumber: sale.invoiceNumber || ensureInvoiceNumber(sale),
    type: 'pos',
    branding: getBranding(),
    createdAt: sale.createdAt,
    cashierName: sale.cashierName || '',
    customerPhone: sale.customerPhone || '',
    items: (sale.items || []).map(item => ({
      name: item.name || 'Unknown',
      quantity: item.quantity || 1,
      unit: item.unit || 'piece',
      price: item.price || 0,
      total: item.total || (item.price * item.quantity) || 0,
    })),
    subtotal: sale.subtotal || 0,
    discount: sale.discount || 0,
    total: sale.total || 0,
    paymentMethod: sale.paymentMethod || 'cash',
    tenderedAmount: sale.tenderedAmount || null,
    change: sale.change || null,
    refunded: sale.refunded || false,
    dueAmount: sale.dueAmount || 0,
    returnNote: sale.refunded ? 'This sale has been refunded.' : null,
    returnNoteBn: sale.refunded ? 'এই সেলটি রিফান্ড করা হয়েছে।' : null,
  };

  logAudit(req, 'invoice_thermal_request', { invoiceNumber: thermalData.invoiceNumber, saleId: orderId });
  res.json({ success: true, data: thermalData });
}));

module.exports = router;
