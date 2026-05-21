/**
 * BaseStore Interface / Abstract Class
 * Defines the contract that all database drivers (JsonStore, SqlStore) must implement.
 */
class BaseStore {
  constructor(name) {
    this.name = name;
  }

  findAll(filter = {}) {
    throw new Error('Method findAll() not implemented');
  }

  findById(id) {
    throw new Error('Method findById() not implemented');
  }

  findOne(filter) {
    throw new Error('Method findOne() not implemented');
  }

  create(data) {
    throw new Error('Method create() not implemented');
  }

  createMany(dataArray) {
    throw new Error('Method createMany() not implemented');
  }

  update(id, data) {
    throw new Error('Method update() not implemented');
  }

  delete(id) {
    throw new Error('Method delete() not implemented');
  }

  count(filter = {}) {
    throw new Error('Method count() not implemented');
  }

  paginate(filter = {}, page = 1, limit = 20, sort = null) {
    throw new Error('Method paginate() not implemented');
  }

  search(fields, query, limit = 20) {
    throw new Error('Method search() not implemented');
  }

  bulkUpdate(updates) {
    throw new Error('Method bulkUpdate() not implemented');
  }

  clear() {
    throw new Error('Method clear() not implemented');
  }
}

module.exports = BaseStore;
