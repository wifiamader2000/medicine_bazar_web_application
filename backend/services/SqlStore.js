const BaseStore = require('./BaseStore');
const knex = require('../config/db');
const config = require('../config');

class SqlStore extends BaseStore {
  constructor(filename) {
    const tableName = filename.replace('.json', '');
    super(tableName);
    this.tableName = tableName;
    this.db = knex;
    this.items = [];
    this.loaded = false;
    this.loadPromise = this._init();
  }

  async _init() {
    try {
      await this._ensureTable();
      const rows = await this.db(this.tableName).select('*');
      this.items = rows.map(row => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
      this.loaded = true;
      if (config.env !== 'test') {
        console.log(`[DB] Successfully loaded ${this.items.length} items from table '${this.tableName}'.`);
      }
    } catch (err) {
      console.error(`[DB ERROR] Failed to load table '${this.tableName}':`, err.message);
      if (config.isProduction()) {
        console.error('⚠️ [CRITICAL] Running in PRODUCTION mode! Silent JSON fallback is disabled. Exiting...\n');
        process.exit(1);
      }
    }
  }

  async _ensureTable() {
    if (!this.db) {
      throw new Error(`Database connection not initialized for SqlStore: ${this.tableName}`);
    }
    const exists = await this.db.schema.hasTable(this.tableName);
    if (!exists) {
      if (config.env !== 'test') {
        console.log(`[DB] Table '${this.tableName}' does not exist. Creating...`);
      }
      await this.db.schema.createTable(this.tableName, (table) => {
        table.string('id', 255).primary();
        if (this.db.client.config.client === 'pg') {
          table.jsonb('data');
        } else {
          table.json('data');
        }
        table.timestamp('created_at').defaultTo(this.db.fn.now());
        table.timestamp('updated_at').defaultTo(this.db.fn.now());
      });
      if (config.env !== 'test') {
        console.log(`[DB] Table '${this.tableName}' created successfully.`);
      }
    }
  }

  findAll(filter = {}) {
    let items = [...this.items];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== '') {
        items = items.filter(item => {
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
    return this.items.find(item => item.id === id) || null;
  }

  findOne(filter) {
    return this.items.find(item => {
      return Object.entries(filter).every(([key, value]) => item[key] === value);
    }) || null;
  }

  create(data) {
    const id = data.id || require('crypto').randomUUID();
    const newItem = {
      ...data,
      id,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    // Update in-memory cache synchronously
    this.items.push(newItem);

    // Persist to DB asynchronously
    const payload = {
      id,
      data: JSON.stringify(newItem),
      created_at: new Date(newItem.createdAt),
      updated_at: new Date(newItem.updatedAt)
    };

    this.db(this.tableName).insert(payload).catch(err => {
      console.error(`[DB WRITE ERROR] Failed to insert record in ${this.tableName}:`, err.message);
    });

    return newItem;
  }

  createMany(dataArray) {
    const newItems = dataArray.map(data => ({
      ...data,
      id: data.id || require('crypto').randomUUID(),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
    }));

    // Update in-memory cache synchronously
    this.items.push(...newItems);

    // Persist to DB asynchronously
    const payloads = newItems.map(item => ({
      id: item.id,
      data: JSON.stringify(item),
      created_at: new Date(item.createdAt),
      updated_at: new Date(item.updatedAt)
    }));

    const chunkSize = 200;
    const insertPromise = (async () => {
      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        await this.db(this.tableName).insert(chunk);
      }
    })();

    insertPromise.catch(err => {
      console.error(`[DB WRITE ERROR] Failed to insert many records in ${this.tableName}:`, err.message);
    });

    return newItems;
  }

  update(id, data) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...this.items[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Update in-memory cache synchronously
    this.items[index] = updatedItem;

    // Persist to DB asynchronously
    this.db(this.tableName).where({ id }).update({
      data: JSON.stringify(updatedItem),
      updated_at: new Date()
    }).catch(err => {
      console.error(`[DB WRITE ERROR] Failed to update record ${id} in ${this.tableName}:`, err.message);
    });

    return updatedItem;
  }

  delete(id) {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    // Update in-memory cache synchronously
    this.items.splice(index, 1);

    // Persist to DB asynchronously
    this.db(this.tableName).where({ id }).delete().catch(err => {
      console.error(`[DB WRITE ERROR] Failed to delete record ${id} from ${this.tableName}:`, err.message);
    });

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
    const data = items.slice(start, start + limit);
    return { data, total, page, limit, totalPages };
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
    let count = 0;
    const payloads = [];

    for (const { id, data } of updates) {
      const index = this.items.findIndex(item => item.id === id);
      if (index !== -1) {
        const updatedItem = {
          ...this.items[index],
          ...data,
          updatedAt: new Date().toISOString()
        };
        // Update memory
        this.items[index] = updatedItem;
        count++;

        payloads.push({
          id,
          data: JSON.stringify(updatedItem),
          updated_at: new Date()
        });
      }
    }

    // Persist to DB asynchronously
    if (payloads.length > 0) {
      const bulkPromise = (async () => {
        await this.db.transaction(async (trx) => {
          for (const payload of payloads) {
            await trx(this.tableName).where({ id: payload.id }).update({
              data: payload.data,
              updated_at: payload.updated_at
            });
          }
        });
      })();

      bulkPromise.catch(err => {
        console.error(`[DB WRITE ERROR] Failed to bulk update records in ${this.tableName}:`, err.message);
      });
    }

    return count;
  }

  clear() {
    this.items = [];
    this.db(this.tableName).truncate().catch(() => {
      return this.db(this.tableName).delete();
    }).catch(err => {
      console.error(`[DB WRITE ERROR] Failed to clear table ${this.tableName}:`, err.message);
    });
  }

  backup() {
    return 'Backup not implemented for SQL driver. Please use standard database dump utilities.';
  }
}

module.exports = SqlStore;
