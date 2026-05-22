const express = require('express');
const router = express.Router();
const DataService = require('../services/DataService');
const NotificationService = require('../services/NotificationService');
const { authenticate, authorize } = require('../middleware/auth');

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

// Helper to get templates store
const getTemplatesStore = () => DataService.get('notificationTemplates');
const getLogsStore = () => DataService.get('notificationLogs');

// All routes require admin or manager
router.use(authenticate, authorize('admin', 'manager'));

/**
 * GET /api/v1/notifications/templates
 * List all templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = await getTemplatesStore().find({});
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/v1/notifications/templates/:key
 * Get single template by key
 */
router.get('/templates/:key', async (req, res) => {
  try {
    const template = await getTemplatesStore().findOne({ key: req.params.key });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template' });
  }
});

/**
 * POST /api/v1/notifications/templates
 * Create or update a template
 */
router.post('/templates', async (req, res) => {
  try {
    const { key, title, channel, subject, body, bodyBn, variables, active } = req.body;
    
    if (!key || !title || !channel) {
      return res.status(400).json({ success: false, message: 'Key, title, and channel are required' });
    }

    const store = getTemplatesStore();
    let template = await store.findOne({ key });

    if (template) {
      // Update
      const updated = {
        ...template,
        title,
        channel,
        subject: subject || null,
        body: body || '',
        bodyBn: bodyBn || '',
        variables: variables || [],
        active: active !== undefined ? active : template.active,
        updatedAt: new Date().toISOString()
      };
      await store.update({ key }, updated);
      res.json({ success: true, message: 'Template updated successfully', data: updated });
    } else {
      // Create
      const newTemplate = {
        id: generateId('tpl'),
        key,
        title,
        channel,
        subject: subject || null,
        body: body || '',
        bodyBn: bodyBn || '',
        variables: variables || [],
        active: active !== undefined ? active : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await store.insert(newTemplate);
      res.status(201).json({ success: true, message: 'Template created successfully', data: newTemplate });
    }
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ success: false, message: 'Failed to save template' });
  }
});

/**
 * POST /api/v1/notifications/send-test
 * Send a test notification
 */
router.post('/send-test', async (req, res) => {
  try {
    const { channel, recipient, templateKey, variables } = req.body;

    if (!channel || !recipient || !templateKey) {
      return res.status(400).json({ success: false, message: 'Channel, recipient, and templateKey are required' });
    }

    // Find template
    const template = await getTemplatesStore().findOne({ key: templateKey });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Render content
    const content = NotificationService.renderTemplate(template.body, variables || {});
    let subject = null;
    if (channel === 'email') {
      subject = NotificationService.renderTemplate(template.subject || 'Notification', variables || {});
    }

    // Dispatch
    const result = await NotificationService.dispatch(
      channel, 
      recipient, 
      content, 
      subject, 
      templateKey, 
      'test', 
      'test', 
      req.user.id
    );

    res.json({
      success: result.success,
      status: result.status,
      message: result.error || 'Test notification processed',
      data: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

/**
 * GET /api/v1/notifications/logs
 * List notification logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { channel, status, templateKey, limit = 50 } = req.query;
    
    let query = {};
    if (channel) query.channel = channel;
    if (status) query.status = status;
    if (templateKey) query.templateKey = templateKey;

    let logs = await getLogsStore().find(query);
    
    // Sort descending by createdAt
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Simple limit
    if (logs.length > limit) {
      logs = logs.slice(0, parseInt(limit));
    }

    // NEVER expose secrets, even if accidentally logged
    logs = logs.map(log => {
      // Strip out anything that looks like a password or key just in case
      const safeLog = { ...log };
      if (safeLog.message) {
         safeLog.message = safeLog.message.replace(/password[:=]\s*\S+/gi, 'password=[REDACTED]');
         safeLog.message = safeLog.message.replace(/api_key[:=]\s*\S+/gi, 'api_key=[REDACTED]');
      }
      return safeLog;
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notification logs' });
  }
});

/**
 * POST /api/v1/notifications/send-order-update
 */
router.post('/send-order-update', async (req, res) => {
  try {
    const { orderId, templateKey } = req.body;
    if (!orderId || !templateKey) {
      return res.status(400).json({ success: false, message: 'orderId and templateKey required' });
    }

    const order = await DataService.get('orders').findOne({ id: orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Determine channel (SMS preferred, fallback to email)
    const channel = order.customerPhone ? 'sms' : (order.customerEmail ? 'email' : null);
    if (!channel) return res.status(400).json({ success: false, message: 'No recipient info in order' });
    
    const recipient = channel === 'sms' ? order.customerPhone : order.customerEmail;
    
    // Fetch template
    const template = await getTemplatesStore().findOne({ key: templateKey });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    // Build variables
    const variables = {
      customerName: order.customerName,
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.orderStatus,
      supportPhone: process.env.WHATSAPP_SUPPORT_NUMBER || ''
    };

    const content = NotificationService.renderTemplate(template.body, variables);
    let subject = null;
    if (channel === 'email') subject = NotificationService.renderTemplate(template.subject, variables);

    const result = await NotificationService.dispatch(
      channel, recipient, content, subject, templateKey, 'order', orderId, req.user.id
    );

    res.json({ success: true, status: result.status, message: 'Processed', data: result });
  } catch (error) {
    console.error('Error sending order update:', error);
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

/**
 * POST /api/v1/notifications/send-due-reminder
 */
router.post('/send-due-reminder', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: 'customerId required' });

    const customer = await DataService.get('customers').findOne({ id: customerId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const templateKey = 'due_payment_reminder';
    const template = await getTemplatesStore().findOne({ key: templateKey });
    if (!template) return res.status(404).json({ success: false, message: 'Template due_payment_reminder not found' });

    if (!customer.phone) return res.status(400).json({ success: false, message: 'Customer has no phone number' });

    const variables = {
      customerName: customer.name,
      dueAmount: customer.dueBalance || 0,
      supportPhone: process.env.WHATSAPP_SUPPORT_NUMBER || ''
    };

    const content = NotificationService.renderTemplate(template.body, variables);
    const result = await NotificationService.dispatch(
      'sms', customer.phone, content, null, templateKey, 'customer', customerId, req.user.id
    );

    res.json({ success: true, status: result.status, message: 'Processed', data: result });
  } catch (error) {
    console.error('Error sending due reminder:', error);
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

module.exports = router;
