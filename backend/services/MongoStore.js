const BaseStore = require('./BaseStore');
const models = require('../models');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Map table names from the old system to Mongoose models
const modelMap = {
  'mb_products': models.Product,
  'mb_categories': models.Category,
  'mb_brands': models.Brand,
  'mb_manufacturers': models.Manufacturer,
  'mb_users': models.User,
  'mb_orders': models.Order,
  'mb_prescriptions': models.Prescription,
  'mb_payments': models.Payment,
  'mb_audit_logs': models.AuditLog,
  'mb_settings': models.Setting,
  'mb_media': models.Media,
  'mb_banners': models.Banner,
  'mb_campaigns': models.Campaign,
  'mb_lab_tests': models.LabTest,
  'mb_pharmacy_applications': models.PharmacyApplication,
  'mb_blogs': models.Blog,
  'mb_pos_sessions': models.POSSession,
  'mb_pos_sales': models.POSTransaction,
  'mb_refunds': models.POSReturn
};

class MongoStore extends BaseStore {
  constructor(filename) {
    const tableName = filename.replace('.json', '');
    super(tableName);
    this.Model = modelMap[tableName];
    if (!this.Model) {
      // Dynamically create the generic model if not already defined
      try {
        this.Model = mongoose.model(tableName);
      } catch (e) {
        this.Model = mongoose.model(tableName, new mongoose.Schema({
          oldId: { type: String, default: null }
        }, { strict: false, timestamps: true }));
      }
    }
    this.items = [];
    this.loaded = false;
    this.loadPromise = this._init();
  }

  // Helper to format mongoose documents to plain objects, renaming _id to id for backwards compatibility
  _format(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    obj.id = obj.oldId || obj._id.toString();
    if (obj.createdAt instanceof Date) obj.createdAt = obj.createdAt.toISOString();
    if (obj.updatedAt instanceof Date) obj.updatedAt = obj.updatedAt.toISOString();
    // Some old code expects .id
    return obj;
  }

  async _init() {
    if (!this.Model) return;
    const docs = await this.Model.find({});
    this.items = docs.map(d => this._format(d));
    this.loaded = true;
  }

  findAll(filter = {}) {
    let items = [...this.items];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter(item => {
          if (key === 'id') return item.id === value || item._id?.toString() === value || item.oldId === value;
          if (typeof value === 'string') {
            return String(item[key] || '').toLowerCase().includes(value.toLowerCase());
          }
          return item[key] === value;
        });
      }
    }
    return items;
  }

  findById(id) {
    return this.items.find(item => item.id === id || item._id?.toString() === id || item.oldId === id) || null;
  }

  findOne(filter) {
    return this.items.find(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (key === 'id') return item.id === value || item._id?.toString() === value || item.oldId === value;
        return item[key] === value;
      });
    }) || null;
  }

  create(data) {
    if (!this.Model) return null;
    const id = data.id || crypto.randomUUID();
    const newItem = {
      ...data,
      id,
      oldId: data.oldId || id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
    this.items.push(newItem);
    this.Model.create({ ...newItem, oldId: newItem.oldId }).catch(err => {
      console.error(`[DB WRITE ERROR] Failed to insert record in ${this.name}:`, err.message);
    });
    return newItem;
  }

  createMany(dataArray) {
    const newItems = dataArray.map(data => {
      const id = data.id || crypto.randomUUID();
      return {
        ...data,
        id,
        oldId: data.oldId || id,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    });
    this.items.push(...newItems);
    if (this.Model && newItems.length > 0) {
      this.Model.insertMany(newItems.map(item => ({ ...item, oldId: item.oldId }))).catch(err => {
        console.error(`[DB WRITE ERROR] Failed to insert many records in ${this.name}:`, err.message);
      });
    }
    return newItems;
  }

  update(id, data) {
    const index = this.items.findIndex(item => item.id === id || item._id?.toString() === id || item.oldId === id);
    if (index === -1) return null;
    const updatedItem = {
      ...this.items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.items[index] = updatedItem;

    if (this.Model) {
      const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { oldId: id };
      this.Model.findOneAndUpdate(query, data, { returnDocument: 'after' }).catch(err => {
        console.error(`[DB WRITE ERROR] Failed to update record ${id} in ${this.name}:`, err.message);
      });
    }
    return updatedItem;
  }

  delete(id) {
    const index = this.items.findIndex(item => item.id === id || item._id?.toString() === id || item.oldId === id);
    if (index === -1) return false;
    this.items.splice(index, 1);

    if (this.Model) {
      const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { oldId: id };
      this.Model.deleteOne(query).catch(err => {
        console.error(`[DB WRITE ERROR] Failed to delete record ${id} from ${this.name}:`, err.message);
      });
    }
    return true;
  }

  count(filter = {}) {
    return this.findAll(filter).length;
  }

  paginate(filter = {}, page = 1, limit = 20, sort = null) {
    let items = this.findAll(filter);
    if (sort) {
      const [field, order] = sort.split(':');
      items.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        if (order === 'desc') return aVal > bVal ? -1 : 1;
        return aVal > bVal ? 1 : -1;
      });
    }
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { data: items.slice(start, start + limit), total, page, limit, totalPages };
  }

  search(fields, query, limit = 20) {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const results = this.items.filter(item => {
      return fields.some(field => {
        const val = item[field];
        if (!val) return false;
        if (Array.isArray(val)) {
          return val.some(v => String(v).toLowerCase().includes(q));
        }
        return String(val).toLowerCase().includes(q);
      });
    });
    return results.slice(0, limit);
  }

  bulkUpdate(updates) {
    if (!this.Model) return 0;
    let count = 0;
    for (const { id, data } of updates) {
      const res = this.update(id, data);
      if (res) count++;
    }
    return count;
  }

  clear() {
    if (!this.Model) return;
    this.items = [];
    this.Model.deleteMany({}).catch(err => {
      console.error(`[DB WRITE ERROR] Failed to clear collection ${this.name}:`, err.message);
    });
  }
}

module.exports = MongoStore;
