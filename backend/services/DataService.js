const JsonStore = require('./JsonStore');
const SqlStore = require('./SqlStore');
const MongoStore = require('./MongoStore');
const config = require('../config');

let StoreClass;
if (config.db.type === 'json') {
  StoreClass = JsonStore;
} else if (config.db.type === 'mongodb') {
  StoreClass = MongoStore;
} else {
  StoreClass = SqlStore;
}

const stores = {
  products: new StoreClass('mb_products.json'),
  categories: new StoreClass('mb_categories.json'),
  brands: new StoreClass('mb_brands.json'),
  manufacturers: new StoreClass('mb_manufacturers.json'),
  generics: new StoreClass('mb_generics.json'),
  indications: new StoreClass('mb_indications.json'),
  drugClasses: new StoreClass('mb_drug_classes.json'),
  dosageForms: new StoreClass('mb_dosage_forms.json'),
  users: new StoreClass('mb_users.json'),
  orders: new StoreClass('mb_orders.json'),
  orderItems: new StoreClass('mb_order_items.json'),
  carts: new StoreClass('mb_carts.json'),
  prescriptions: new StoreClass('mb_prescriptions.json'),
  payments: new StoreClass('mb_payments.json'),
  auditLogs: new StoreClass('mb_audit_logs.json'),
  settings: new StoreClass('mb_settings.json'),
  media: new StoreClass('mb_media.json'),
  banners: new StoreClass('mb_banners.json'),
  campaigns: new StoreClass('mb_campaigns.json'),
  labTests: new StoreClass('mb_lab_tests.json'),
  labBookings: new StoreClass('mb_lab_bookings.json'),
  pharmacyApplications: new StoreClass('mb_pharmacy_applications.json'),
  blogs: new StoreClass('mb_blogs.json'),
  reviews: new StoreClass('mb_reviews.json'),
  coupons: new StoreClass('mb_coupons.json'),
  loyaltyPoints: new StoreClass('mb_loyalty_points.json'),
  posSessions: new StoreClass('mb_pos_sessions.json'),
  posSales: new StoreClass('mb_pos_sales.json'),
  refunds: new StoreClass('mb_refunds.json'),
  importHistory: new StoreClass('mb_import_history.json'),
  suppliers: new StoreClass('mb_suppliers.json'),
  purchaseOrders: new StoreClass('mb_purchase_orders.json'),
  warehouses: new StoreClass('mb_warehouses.json'),
  transfers: new StoreClass('mb_transfers.json'),
  notifications: new StoreClass('mb_notifications.json'),
  searchLogs: new StoreClass('mb_search_logs.json'),
  addresses: new StoreClass('mb_addresses.json'),
  wishlist: new StoreClass('mb_wishlist.json'),
  transactions: new StoreClass('mb_transactions.json'),
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

  static async init() {
    if (config.db.type === 'json') return;
    const promises = [];
    for (const name of Object.keys(stores)) {
      const store = stores[name];
      if (store.loadPromise) {
        promises.push(store.loadPromise);
      }
    }
    await Promise.all(promises);
  }
}

module.exports = DataService;
