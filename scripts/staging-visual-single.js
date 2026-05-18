const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { chromium } = require('playwright');
const config = require('../backend/config');

const BASE = process.env.QA_BASE || 'http://localhost:5050';
const name = process.argv[2];
const rawPath = process.argv[3];
const width = Number(process.argv[4] || 1366);
const height = Number(process.argv[5] || 768);
const role = process.argv[6] || '';
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

function localAuth(targetRole) {
  const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'database/mb_users.json'), 'utf8'));
  const user = users.find((item) => item.role === targetRole && item.active !== false)
    || users.find((item) => item.role === 'admin' && item.active !== false);
  if (!user) throw new Error(`No local ${targetRole} user found`);
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '2h' },
  );
  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.resetPasswordTokenHash;
  delete safeUser.resetPasswordExpires;
  return { token, user: safeUser };
}

async function authFor(request, targetRole) {
  if (['admin', 'cashier', 'customer'].includes(targetRole)) return localAuth(targetRole);
  return null;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  const auth = await authFor(context.request, role);
  if (auth) {
    await context.addCookies([{ name: 'token', value: auth.token, url: BASE }]);
    await context.addInitScript(({ token, user }) => {
      localStorage.setItem('mb_token', token);
      localStorage.setItem('mb_user', JSON.stringify(user));
    }, { token: auth.token, user: auth.user });
  }

  let targetPath = rawPath;
  if (targetPath === '/product/auto') {
    const product = (await api(context.request, '/products?limit=1')).data.data[0];
    targetPath = `/product/${product.id}`;
  }
  if (targetPath === '/checkout' && auth) {
    const product = (await api(context.request, '/products?limit=1')).data.data[0];
    await api(context.request, '/cart/add', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      data: { productId: product.id, quantity: 1 },
    });
  }
  if (targetPath.includes('/admin/pos') && auth) {
    await api(context.request, '/pos/open-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
      data: { openingCash: 0 },
    }).catch(() => {});
  }

  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => failedRequests.push(`${request.resourceType()}:${request.url()}`));

  const response = await page.goto(`${BASE}${targetPath}`, { waitUntil: 'commit', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => {});
  await page.waitForTimeout(900);

  const metrics = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const nav = document.querySelector('.header-nav');
    return {
      title: document.title,
      finalUrl: location.href,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      brokenImages: Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src),
      hasMojibake: /à¦|à§|ï¸|â|�/.test(text),
      headerPresent: Boolean(document.querySelector('.header') || document.querySelector('.admin-topbar')),
      footerPresent: Boolean(document.querySelector('.footer') || document.querySelector('.admin-sidebar')),
      productCards: document.querySelectorAll('.product-card').length,
      visibleButtons: Array.from(document.querySelectorAll('button, a.btn, .header-pill')).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      inputs: Array.from(document.querySelectorAll('input, textarea, select')).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      adminStats: document.querySelectorAll('.stat-card').length,
      posLayout: Boolean(document.querySelector('.pos-layout')),
      mobileMenuWorks: (() => {
        const btn = document.querySelector('.mobile-menu-btn');
        if (!btn || !nav || innerWidth > 600) return null;
        btn.click();
        return nav.classList.contains('show');
      })(),
    };
  });

  const safeName = `${width}x${height}-${name}`.replace(/[^a-z0-9._-]+/gi, '-');
  await page.screenshot({ path: path.join(outDir, `${safeName}.png`), fullPage: false, timeout: 10000 });
  await browser.close();
  console.log(JSON.stringify({ name, path: targetPath, viewport: `${width}x${height}`, status: response.status(), consoleErrors, failedRequests, ...metrics }));
})().catch((error) => {
  console.error(JSON.stringify({ name, path: rawPath, viewport: `${width}x${height}`, error: error.message }));
  process.exit(1);
});
