const fs = require('fs');
const path = require('path');
const config = require('../config');

class JsonStore {
  constructor(filename) {
    this.filePath = path.join(config.paths.database, filename);
    this._ensureFile();
  }

  _ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, '[]', 'utf8');
    }
  }

  _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  findAll(filter = {}) {
    let items = this._read();
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
    const items = this._read();
    return items.find(item => item.id === id) || null;
  }

  findOne(filter) {
    const items = this._read();
    return items.find(item => {
      return Object.entries(filter).every(([key, value]) => item[key] === value);
    }) || null;
  }

  create(data) {
    const items = this._read();
    const newItem = {
      ...data,
      id: data.id || require('crypto').randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    this._write(items);
    return newItem;
  }

  createMany(dataArray) {
    const items = this._read();
    const newItems = dataArray.map(data => ({
      ...data,
      id: data.id || require('crypto').randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    items.push(...newItems);
    this._write(items);
    return newItems;
  }

  update(id, data) {
    const items = this._read();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    this._write(items);
    return items[index];
  }

  delete(id) {
    const items = this._read();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    this._write(items);
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
    const items = this._read();
    const results = items.filter(item => {
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
    const items = this._read();
    let count = 0;
    for (const { id, data } of updates) {
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
        count++;
      }
    }
    this._write(items);
    return count;
  }

  clear() {
    this._write([]);
  }

  backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.filePath.replace('.json', `_backup_${timestamp}.json`);
    fs.copyFileSync(this.filePath, backupPath);
    return backupPath;
  }
}

module.exports = JsonStore;
