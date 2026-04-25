const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const BASE = process.env.TEST_URL || 'http://localhost:5050';

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
        email: 'admin@medicinebazar.com',
        password: 'Admin@MedBazar2024',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.token);
      assert.strictEqual(res.data.data.user.role, 'admin');
      adminToken = res.data.data.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request('POST', '/api/v1/auth/login', {
        email: 'admin@medicinebazar.com',
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
      assert.strictEqual(res.data.data.email, 'admin@medicinebazar.com');
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
