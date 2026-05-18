const JsonStore = require('./JsonStore');
const config = require('../config');

const stores = {
  products: new JsonStore('mb_products.json'),
  categories: new JsonStore('mb_categories.json'),
  brands: new JsonStore('mb_brands.json'),
  manufacturers: new JsonStore('mb_manufacturers.json'),
  generics: new JsonStore('mb_generics.json'),
  indications: new JsonStore('mb_indications.json'),
  drugClasses: new JsonStore('mb_drug_classes.json'),
  dosageForms: new JsonStore('mb_dosage_forms.json'),
  users: new JsonStore('mb_users.json'),
  orders: new JsonStore('mb_orders.json'),
  orderItems: new JsonStore('mb_order_items.json'),
  carts: new JsonStore('mb_carts.json'),
  prescriptions: new JsonStore('mb_prescriptions.json'),
  payments: new JsonStore('mb_payments.json'),
  auditLogs: new JsonStore('mb_audit_logs.json'),
  settings: new JsonStore('mb_settings.json'),
  media: new JsonStore('mb_media.json'),
  banners: new JsonStore('mb_banners.json'),
  campaigns: new JsonStore('mb_campaigns.json'),
  labTests: new JsonStore('mb_lab_tests.json'),
  labBookings: new JsonStore('mb_lab_bookings.json'),
  pharmacyApplications: new JsonStore('mb_pharmacy_applications.json'),
  blogs: new JsonStore('mb_blogs.json'),
  reviews: new JsonStore('mb_reviews.json'),
  coupons: new JsonStore('mb_coupons.json'),
  loyaltyPoints: new JsonStore('mb_loyalty_points.json'),
  posSessions: new JsonStore('mb_pos_sessions.json'),
  posSales: new JsonStore('mb_pos_sales.json'),
  refunds: new JsonStore('mb_refunds.json'),
  importHistory: new JsonStore('mb_import_history.json'),
  suppliers: new JsonStore('mb_suppliers.json'),
  purchaseOrders: new JsonStore('mb_purchase_orders.json'),
  warehouses: new JsonStore('mb_warehouses.json'),
  transfers: new JsonStore('mb_transfers.json'),
  notifications: new JsonStore('mb_notifications.json'),
  searchLogs: new JsonStore('mb_search_logs.json'),
  addresses: new JsonStore('mb_addresses.json'),
  wishlist: new JsonStore('mb_wishlist.json'),
};

class DataService {
  static get(storeName) {
    if (!stores[storeName]) {
      throw new Error(`Store '${storeName}' not found`);
    }
    return stores[storeName];
  }

  static getStorageMode() {
    return config.db.type === 'json' ? 'json' : 'database';
  }

  static getStoreNames() {
    return Object.keys(stores);
  }

  static getStats() {
    const stats = {};
    for (const [name, store] of Object.entries(stores)) {
      stats[name] = store.count();
    }
    return stats;
  }
}

module.exports = DataService;
