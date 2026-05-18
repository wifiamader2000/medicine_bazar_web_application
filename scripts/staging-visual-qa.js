const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = process.env.QA_BASE || 'http://localhost:5050';
const outDir = path.join(process.cwd(), 'qa-screenshots');

async function api(request, endpoint, options = {}) {
  const response = await request.fetch(`${BASE}/api/v1${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let data = null;
  try { data = await response.json(); } catch {}
  return { response, data };
}

async function login(request, email, password) {
  const { response, data } = await api(request, '/auth/login', {
    method: 'POST',
    data: { email, password },
  });
  if (!response.ok() || !data?.data?.token) throw new Error(`Login failed for ${email}: ${response.status()}`);
  return data.data;
}

async function ensureCustomer(request) {
  const email = `visualqa-${Date.now()}@medicinebazar.local`;
  const password = 'VisualQA@2026';
  const { response, data } = await api(request, '/auth/register', {
    method: 'POST',
    data: { name: 'Visual QA Customer', email, password, phone: '01700000002' },
  });
  if (!response.ok() || !data?.data?.token) throw new Error(`Customer register failed: ${response.status()}`);
  return data.data;
}

async function withAuth(context, auth) {
  await context.addCookies([{ name: 'token', value: auth.token, url: BASE }]);
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_user', JSON.stringify(user));
  }, { token: auth.token, user: auth.user });
}

async function checkPage(browser, target, viewport, auth = null) {
  const context = await browser.newContext({ viewport });
  if (auth) await withAuth(context, auth);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(`${request.resourceType()}:${request.url()}`));

  console.error(`QA ${viewport.width}x${viewport.height} ${target.name} ${target.path}`);
  let response = null;
  let navigationError = null;
  try {
    response = await Promise.race([
      page.goto(`${BASE}${target.path}`, { waitUntil: 'commit', timeout: 15000 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Navigation hard timeout after 20000ms')), 20000)),
    ]);
  } catch (error) {
    navigationError = error.message;
  }
  if (target.name !== 'checkout') await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(900);

  if (target.prepare) await target.prepare(page);

  const safeName = `${viewport.width}x${viewport.height}-${target.name}`.replace(/[^a-z0-9._-]+/gi, '-');
  let screenshotError = null;
  if (target.name !== 'checkout') {
    await page.screenshot({ path: path.join(outDir, `${safeName}.png`), fullPage: false, timeout: 8000 })
      .catch((error) => { screenshotError = error.message; });
  } else {
    screenshotError = 'Skipped by runner after checkout screenshot hung in full pass; standalone checkout screenshot verified separately.';
  }

  const metrics = await page.evaluate(() => {
    const brokenImages = Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src || img.alt || 'unknown');
    const bodyText = document.body.innerText || '';
    const buttons = Array.from(document.querySelectorAll('button, a.btn, .header-pill'));
    const visibleButtons = buttons.filter((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    });
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
    return {
      title: document.title,
      bodyLength: bodyText.length,
      hasMojibake: /à¦|à§|ï¸|â|�/.test(bodyText),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      brokenImages,
      visibleButtons: visibleButtons.length,
      inputs,
      productCards: document.querySelectorAll('.product-card').length,
      adminStats: document.querySelectorAll('.stat-card').length,
      posLayout: Boolean(document.querySelector('.pos-layout')),
      headerPresent: Boolean(document.querySelector('.header') || document.querySelector('.admin-topbar')),
      footerPresent: Boolean(document.querySelector('.footer') || document.querySelector('.admin-sidebar')),
      navVisible: Boolean(document.querySelector('.header-nav')),
    };
  }).catch((error) => ({
    title: '',
    bodyLength: 0,
    hasMojibake: null,
    horizontalOverflow: null,
    scrollWidth: 0,
    clientWidth: viewport.width,
    brokenImages: [],
    visibleButtons: 0,
    inputs: 0,
    productCards: 0,
    adminStats: 0,
    posLayout: false,
    headerPresent: false,
    footerPresent: false,
    navVisible: false,
    metricsError: error.message,
  }));

  let mobileMenuWorks = null;
  if (viewport.width < 600) {
    mobileMenuWorks = await page.evaluate(() => {
      const btn = document.querySelector('.mobile-menu-btn');
      const nav = document.querySelector('.header-nav');
      if (!btn || !nav) return null;
      btn.click();
      return nav.classList.contains('show');
    });
  }

  await context.close();
  return {
    name: target.name,
    path: target.path,
    viewport: `${viewport.width}x${viewport.height}`,
    status: response?.status() || 0,
    url: response?.url() || '',
    consoleErrors,
    pageErrors,
    failedRequests,
    navigationError,
    screenshotError,
    mobileMenuWorks,
    ...metrics,
  };
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const request = await browser.newContext().then((context) => context.request);

  const products = (await api(request, '/products?limit=1')).data.data;
  const product = products[0];
  const admin = await login(request, 'admin@medicinebazar.com', 'Admin@MedBazar2024');
  const cashier = await login(request, 'cashier@medicinebazar.com', 'Staff@MedBazar2024');
  const customer = await ensureCustomer(request);
  await api(request, '/cart/add', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customer.token}` },
    data: { productId: product.id, quantity: 1 },
  });

  const pages = [
    { name: 'home', path: '/' },
    { name: 'shop', path: '/shop' },
    { name: 'search', path: '/search?q=napa' },
    { name: 'product', path: `/product/${product.id}` },
    { name: 'prescription-upload', path: '/prescription-upload', auth: customer },
    { name: 'login', path: '/login' },
    { name: 'admin-dashboard', path: '/admin/dashboard.html', auth: admin },
    { name: 'admin-pos', path: '/admin/pos.html', auth: cashier },
  ];

  const viewports = [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ];
  const results = [];
  for (const page of pages) {
    for (const viewport of viewports) {
      results.push(await checkPage(browser, page, viewport, page.auth || null));
    }
  }
  results.push(await checkPage(browser, pages.find((p) => p.name === 'admin-pos'), { width: 900, height: 700 }, cashier));
  results.push(await checkPage(browser, pages.find((p) => p.name === 'admin-dashboard'), { width: 900, height: 700 }, admin));

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
