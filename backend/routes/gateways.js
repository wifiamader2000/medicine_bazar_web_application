const express = require('express');
const router = express.Router();
const PaymentGatewayService = require('../services/PaymentGatewayService');

// Safe public/auth endpoint to get available gateways and their configurations
router.get('/status', (req, res) => {
  const statuses = PaymentGatewayService.getGatewayStatus();
  res.json({ success: true, data: statuses });
});

// === BKASH ===

router.post('/bkash/init', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID required' });
  }

  // Pass a dummy order object for now, just to show how it works
  const result = PaymentGatewayService.initBkashPayment({ id: orderId });
  
  // As per instructions, it should return success: false, status: 'gateway_not_configured'
  res.status(result.status === 'gateway_not_configured' ? 503 : 200).json(result);
});

router.post('/bkash/callback', (req, res) => {
  const result = PaymentGatewayService.verifyCallback('bkash', req.body);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  // Real verification logic would update the order here
  res.json({ success: true, status: 'verified' });
});


// === NAGAD ===

router.post('/nagad/init', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID required' });
  }

  const result = PaymentGatewayService.initNagadPayment({ id: orderId });
  res.status(result.status === 'gateway_not_configured' ? 503 : 200).json(result);
});

router.post('/nagad/callback', (req, res) => {
  const result = PaymentGatewayService.verifyCallback('nagad', req.body);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  res.json({ success: true, status: 'verified' });
});


// === SSLCOMMERZ ===

router.post('/sslcommerz/init', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID required' });
  }

  const result = PaymentGatewayService.initSSLCommerzPayment({ id: orderId });
  res.status(result.status === 'gateway_not_configured' ? 503 : 200).json(result);
});

router.post('/sslcommerz/callback', (req, res) => {
  const result = PaymentGatewayService.verifyCallback('sslcommerz', req.body);
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  res.json({ success: true, status: 'verified' });
});

module.exports = router;
