const DataService = require('./DataService');

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

class NotificationService {
  /**
   * Replace {{variable}} safely
   */
  static renderTemplate(template, variables) {
    if (!template) return '';
    if (!variables || typeof variables !== 'object') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return variables[trimmedKey] !== undefined ? String(variables[trimmedKey]) : '';
    });
  }

  /**
   * Safely check SMS credentials and fake provider interface
   */
  static async sendSMS(phone, message) {
    const provider = process.env.SMS_PROVIDER || 'disabled';
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;

    if (provider === 'disabled' || !provider || !apiKey) {
      return {
        success: false,
        status: 'provider_not_configured',
        error: 'SMS provider is not configured or disabled.'
      };
    }

    // Provider logic would go here in production
    // We are instructed NOT to fake success.
    // If we reach here, it implies a real attempt should be made, but since we don't have real integration yet:
    return {
      success: false,
      status: 'provider_not_configured',
      error: 'Real SMS provider integration not implemented.'
    };
  }

  /**
   * Safely check Email credentials and fake provider interface
   */
  static async sendEmail(email, subject, body) {
    const provider = process.env.EMAIL_PROVIDER || 'disabled';
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM;

    if (provider === 'disabled' || !provider || !host || !user || !pass || !from) {
      return {
        success: false,
        status: 'provider_not_configured',
        error: 'Email provider is not configured or disabled.'
      };
    }

    // Provider logic would go here in production
    // We are instructed NOT to fake success.
    return {
      success: false,
      status: 'provider_not_configured',
      error: 'Real Email provider integration not implemented.'
    };
  }

  /**
   * WhatsApp placeholder
   */
  static async sendWhatsAppPlaceholder(phone, message) {
    const waNumber = process.env.WHATSAPP_SUPPORT_NUMBER || '8801602444532';
    // Clean phone number
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const encodedMessage = encodeURIComponent(message || '');
    
    return {
      success: true, // we successfully generated the link
      status: 'manual_action_required',
      waLink: `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
      supportNumber: waNumber
    };
  }

  /**
   * Log notification result
   */
  static async logNotification({ templateKey, channel, recipient, status, message, referenceType, referenceId, error, createdBy }) {
    try {
      const logsStore = DataService.get('notificationLogs');
      const newLog = {
        id: generateId('log'),
        templateKey,
        channel,
        recipient,
        status,
        message,
        referenceType: referenceType || null,
        referenceId: referenceId || null,
        error: error || null,
        createdAt: new Date().toISOString(),
        createdBy: createdBy || 'system'
      };
      
      await logsStore.insert(newLog);
      return newLog;
    } catch (err) {
      console.error('Failed to log notification:', err.message);
      return null;
    }
  }

  /**
   * Dispatch based on channel
   */
  static async dispatch(channel, recipient, content, subject, templateKey, referenceType, referenceId, createdBy) {
    let result;

    try {
      if (channel === 'sms') {
        result = await this.sendSMS(recipient, content);
      } else if (channel === 'email') {
        result = await this.sendEmail(recipient, subject, content);
      } else if (channel === 'whatsapp') {
        result = await this.sendWhatsAppPlaceholder(recipient, content);
      } else {
        result = { success: false, status: 'failed', error: 'Invalid channel' };
      }
    } catch (error) {
      result = { success: false, status: 'failed', error: error.message };
    }

    // Log the notification
    await this.logNotification({
      templateKey,
      channel,
      recipient,
      status: result.status,
      message: content,
      referenceType,
      referenceId,
      error: result.error,
      createdBy
    });

    return result;
  }
}

module.exports = NotificationService;
