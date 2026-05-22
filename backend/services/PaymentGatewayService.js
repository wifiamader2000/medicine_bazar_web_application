const DataService = require('./DataService');

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

class PaymentGatewayService {
  /**
   * Get the current status of all payment gateways.
   * Returns whether they are enabled/configured, but NEVER returns secrets.
   */
  static getGatewayStatus() {
    return {
      bkash: {
        configured: !!process.env.BKASH_APP_KEY && !!process.env.BKASH_APP_SECRET,
        enabled: process.env.BKASH_ENABLED === 'true'
      },
      nagad: {
        configured: !!process.env.NAGAD_MERCHANT_ID && !!process.env.NAGAD_PUBLIC_KEY,
        enabled: process.env.NAGAD_ENABLED === 'true'
      },
      sslcommerz: {
        configured: !!process.env.SSLCOMMERZ_STORE_ID && !!process.env.SSLCOMMERZ_STORE_PASSWORD,
        enabled: process.env.SSLCOMMERZ_ENABLED === 'true'
      },
      manual: {
        active: true // Always true
      }
    };
  }

  /**
   * Safely log a gateway attempt if storage exists.
   */
  static logGatewayAttempt(gateway, action, payload, status) {
    try {
      // We will try to log to a gatewayLogs collection, if it doesn't exist, we skip safely.
      const store = DataService.get('paymentGatewayLogs');
      if (store) {
        store.push({
          id: generateId('gwlog'),
          gateway,
          action,
          payload,
          status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      // Silently fail logging if it's unsupported
    }
  }

  static initBkashPayment(order) {
    const status = this.getGatewayStatus().bkash;
    
    if (!status.configured || !status.enabled) {
      this.logGatewayAttempt('bkash', 'init', { orderId: order.id || order._id }, 'gateway_not_configured');
      return {
        success: false,
        status: 'gateway_not_configured',
        gateway: 'bkash'
      };
    }

    // In the future: Actually call bKash init API
    return {
      success: false,
      status: 'gateway_not_configured',
      gateway: 'bkash',
      message: 'Not implemented yet'
    };
  }

  static initNagadPayment(order) {
    const status = this.getGatewayStatus().nagad;
    
    if (!status.configured || !status.enabled) {
      this.logGatewayAttempt('nagad', 'init', { orderId: order.id || order._id }, 'gateway_not_configured');
      return {
        success: false,
        status: 'gateway_not_configured',
        gateway: 'nagad'
      };
    }

    // In the future: Actually call Nagad init API
    return {
      success: false,
      status: 'gateway_not_configured',
      gateway: 'nagad',
      message: 'Not implemented yet'
    };
  }

  static initSSLCommerzPayment(order) {
    const status = this.getGatewayStatus().sslcommerz;
    
    if (!status.configured || !status.enabled) {
      this.logGatewayAttempt('sslcommerz', 'init', { orderId: order.id || order._id }, 'gateway_not_configured');
      return {
        success: false,
        status: 'gateway_not_configured',
        gateway: 'sslcommerz'
      };
    }

    // In the future: Actually call SSLCommerz init API
    return {
      success: false,
      status: 'gateway_not_configured',
      gateway: 'sslcommerz',
      message: 'Not implemented yet'
    };
  }

  static verifyCallback(gateway, payload) {
    const statuses = this.getGatewayStatus();
    let statusConfig;

    if (gateway === 'bkash') statusConfig = statuses.bkash;
    else if (gateway === 'nagad') statusConfig = statuses.nagad;
    else if (gateway === 'sslcommerz') statusConfig = statuses.sslcommerz;
    else {
      return { success: false, status: 'invalid_gateway' };
    }

    if (!statusConfig.configured || !statusConfig.enabled) {
      this.logGatewayAttempt(gateway, 'callback', payload, 'gateway_not_configured');
      return {
        success: false,
        status: 'gateway_not_configured'
      };
    }

    // In the future: verify signature/payload using real secrets
    this.logGatewayAttempt(gateway, 'callback', payload, 'unverified');
    
    return {
      success: false,
      status: 'unverified_callback'
    };
  }
}

module.exports = PaymentGatewayService;
