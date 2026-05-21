const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BASE = process.env.TEST_URL || 'http://localhost:5050';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@medicinebazar.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || `Test-${crypto.randomUUID()}!Aa1`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Medicine Bazar API Tests', () => {
  let adminToken = null;
  let server = null;
  let originalAdminPassword = null;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const appServer = require('../server');
    server = await appServer.startServer();
    const DataService = require('../services/DataService');
    const admin = DataService.get('users').findOne({ email: TEST_ADMIN_EMAIL });
    assert.ok(admin, 'Admin test user must exist');
    originalAdminPassword = admin.password;
    DataService.get('users').update(admin.id, { password: await bcrypt.hash(TEST_ADMIN_PASSWORD, 12) });
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  after(async () => {
    if (originalAdminPassword) {
      const DataService = require('../services/DataService');
      const admin = DataService.get('users').findOne({ email: TEST_ADMIN_EMAIL });
      if (admin) DataService.get('users').update(admin.id, { password: originalAdminPassword });
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    if (server) await new Promise(resolve => server.close(resolve));
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request('GET', '/api/v1/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.status, 'healthy');
      assert.ok(res.data.data.productCount >= 0);
    });
  });

  describe('Authentication', () => {
    it('should login admin user', async () => {
      const res = await request('POST', '/api/v1/auth/login', {
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.token);
      assert.strictEqual(res.data.data.user.role, 'admin');
      adminToken = res.data.data.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request('POST', '/api/v1/auth/login', {
        email: TEST_ADMIN_EMAIL,
        password: 'wrongpassword',
      });
      assert.strictEqual(res.data.success, false);
    });

    it('should return user profile with valid token', async () => {
      const res = await request('GET', '/api/v1/auth/me', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.email, TEST_ADMIN_EMAIL);
    });

    it('should reject unauthenticated access to admin routes', async () => {
      const res = await request('GET', '/api/v1/admin/dashboard');
      assert.ok([401, 403].includes(res.status));
    });
  });

  describe('Products API', () => {
    it('should list products', async () => {
      const res = await request('GET', '/api/v1/products');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(Array.isArray(res.data.data));
      assert.ok(res.data.data.length > 0);
    });

    it('should get product by ID', async () => {
      const listRes = await request('GET', '/api/v1/products?limit=1');
      const productId = listRes.data.data[0].id;
      const res = await request('GET', `/api/v1/products/${productId}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.name);
    });

    it('should support pagination', async () => {
      const res = await request('GET', '/api/v1/products?page=1&limit=5');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.pagination);
      assert.ok(res.data.pagination.total > 0);
    });
  });

  describe('Search API', () => {
    it('should return search suggestions', async () => {
      const res = await request('GET', '/api/v1/search/suggestions?q=napa');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.length > 0);
      const names = res.data.data.map(p => p.name.toLowerCase());
      assert.ok(names.some(n => n.includes('napa')));
    });

    it('should search products', async () => {
      const res = await request('GET', '/api/v1/search/products?q=paracetamol');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length > 0);
    });

    it('should initialize search adapter structure', async () => {
      const SearchService = require('../services/search/SearchService');
      const providerName = SearchService.getProviderName();
      assert.ok(providerName === 'local' || providerName === 'meilisearch' || providerName === 'algolia');
    });

    it('should log failed search queries to search logs', async () => {
      const uniqueTerm = 'nonexistent_medicine_xyz_' + Date.now();
      const res = await request('GET', `/api/v1/search/products?q=${uniqueTerm}`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.length, 0);

      const DataService = require('../services/DataService');
      const logs = DataService.get('searchLogs').findAll({});
      const matchedLog = logs.find(l => l.query === uniqueTerm || l.noResultTerm === uniqueTerm);
      
      assert.ok(matchedLog);
      assert.strictEqual(matchedLog.resultCount, 0);
      assert.strictEqual(matchedLog.noResultTerm, uniqueTerm);
      assert.ok(matchedLog.timestamp);
    });

    it('should expose zero-result reports endpoint to admin and restrict unauthorized users', async () => {
      const adminRes = await request('GET', '/api/v1/reports/search-logs', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(adminRes.status, 200);
      assert.strictEqual(adminRes.data.success, true);
      assert.ok(Array.isArray(adminRes.data.data));

      const anonRes = await request('GET', '/api/v1/reports/search-logs');
      assert.ok([401, 403].includes(anonRes.status));
    });
  });

  describe('Categories API', () => {
    it('should list categories', async () => {
      const res = await request('GET', '/api/v1/categories');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.length > 0);
    });
  });

  describe('Homepage API', () => {
    it('should return homepage data', async () => {
      const res = await request('GET', '/api/v1/homepage');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.categories);
      assert.ok(res.data.data.featured);
    });
  });

  describe('Payment Methods API', () => {
    it('should return payment methods', async () => {
      const res = await request('GET', '/api/v1/payment-methods');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.nagad);
      assert.ok(res.data.data.bkash);
      assert.ok(res.data.data.cod);
    });
  });

  describe('Admin API (Protected)', () => {
    it('should load admin dashboard', async () => {
      const res = await request('GET', '/api/v1/admin/dashboard', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.totalProducts >= 0);
    });

    it('should list admin categories', async () => {
      const res = await request('GET', '/api/v1/admin/categories', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
    });

    it('should list users', async () => {
      const res = await request('GET', '/api/v1/admin/users', null, {
        Authorization: `Bearer ${adminToken}`,
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length > 0);
    });
  });

  describe('Page Routes', () => {
    it('should serve homepage', async () => {
      const res = await request('GET', '/');
      assert.strictEqual(res.status, 200);
    });

    it('should serve shop page', async () => {
      const res = await request('GET', '/shop');
      assert.strictEqual(res.status, 200);
    });

    it('should serve login page', async () => {
      const res = await request('GET', '/login');
      assert.strictEqual(res.status, 200);
    });
  });
});
