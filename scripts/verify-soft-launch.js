process.env.NODE_ENV = 'test';

const { startServer } = require('../backend/server');

const BASE = 'http://localhost:5050/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@medicinebazar.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const CUSTOMER_PASSWORD = process.env.SOFT_LAUNCH_CUSTOMER_PASSWORD;

if (!ADMIN_PASSWORD || !CUSTOMER_PASSWORD) {
  throw new Error('Set ADMIN_PASSWORD and SOFT_LAUNCH_CUSTOMER_PASSWORD before running soft launch verification.');
}

async function api(endpoint, options = {}) {
  const res = await fetch(BASE + endpoint, options);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${endpoint} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function login(email, password) {
  const res = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.data.token;
}

async function registerCustomer() {
  const email = `softlaunch-${Date.now()}@medicinebazar.local`;
  const res = await api('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Soft Launch Customer', email, password: CUSTOMER_PASSWORD, phone: '01602444532' }),
  });
  return res.data.token;
}

async function main() {
  const server = startServer();
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
    const customerToken = await registerCustomer();
    const otherCustomerToken = await registerCustomer();
    const auth = token => ({ Authorization: `Bearer ${token}` });
    const jsonAuth = token => ({ ...auth(token), 'Content-Type': 'application/json' });

    const homepage = await api('/homepage');
    const shop = await api('/products?limit=12');
    const search = await api('/search/products?q=paracetamol&limit=5');
    const product = await api(`/products/${shop.data[0].id}`);
    const adminProducts = await api('/products?limit=50', { headers: auth(adminToken) });
    const posSuggestion = await api('/search/suggestions?q=paracetamol&limit=1');

    const selected = posSuggestion.data[0] || shop.data[0];
    let session = await api('/pos/current-session', { headers: auth(adminToken) });
    if (!session.data) {
      await api('/pos/open-session', {
        method: 'POST',
        headers: jsonAuth(adminToken),
        body: JSON.stringify({ openingCash: 1000 }),
      });
    }
    const sale = await api('/pos/sale', {
      method: 'POST',
      headers: jsonAuth(adminToken),
      body: JSON.stringify({ items: [{ productId: selected.id, quantity: 1, price: selected.sellingPrice || selected.mrp || 1 }], paymentMethod: 'cash' }),
    });
    const refund = await api('/pos/refund', {
      method: 'POST',
      headers: jsonAuth(adminToken),
      body: JSON.stringify({ saleId: sale.data.id, items: [{ productId: selected.id, quantity: 1 }], reason: 'Soft launch verification' }),
    });

    const order = await api('/orders', {
      method: 'POST',
      headers: jsonAuth(customerToken),
      body: JSON.stringify({
        items: [{ productId: selected.id, quantity: 1 }],
        shippingAddress: { name: 'Soft Launch Customer', phone: '01602444532', address: 'Dhaka', city: 'Dhaka' },
        paymentMethod: 'bkash',
        transactionId: `TX${Date.now()}`,
      }),
    });

    const png = new Blob([Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex')], { type: 'image/png' });
    const proof = new FormData();
    proof.append('proof', png, 'payment-proof.png');
    await api(`/orders/${order.data.id}/payment-proof`, { method: 'POST', headers: auth(customerToken), body: proof });

    const rxForm = new FormData();
    rxForm.append('patientName', 'Soft Launch Patient');
    rxForm.append('doctorName', 'Dr Verification');
    rxForm.append('prescription', png, 'prescription.png');
    const rx = await api('/prescriptions/upload', { method: 'POST', headers: auth(customerToken), body: rxForm });
    const ownDownload = await fetch(`${BASE}/prescriptions/download/${rx.data.id}`, { headers: auth(customerToken) });
    const adminDownload = await fetch(`${BASE}/prescriptions/download/${rx.data.id}`, { headers: auth(adminToken) });
    const otherDownload = await fetch(`${BASE}/prescriptions/download/${rx.data.id}`, { headers: auth(otherCustomerToken) });

    const reports = await Promise.all([
      api('/reports/sales', { headers: auth(adminToken) }),
      api('/reports/stock', { headers: auth(adminToken) }),
      api('/reports/expiry', { headers: auth(adminToken) }),
    ]);

    console.log(JSON.stringify({
      homepage: homepage.success && homepage.data.productCount >= 2000,
      shop: shop.pagination.total >= 2000,
      search: search.data.length > 0,
      productDetail: Boolean(product.data.name),
      adminProductList: adminProducts.pagination.total >= 2000,
      posSearch: posSuggestion.data.length > 0,
      posSaleRefund: sale.success && refund.success,
      checkout: order.success,
      paymentProof: true,
      prescriptionUpload: rx.success,
      prescriptionDownloadPrivacy: ownDownload.status === 200 && adminDownload.status === 200 && otherDownload.status === 403,
      reports: reports.every(r => r.success),
    }, null, 2));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
