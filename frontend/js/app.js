/* Medicine Bazar - Core Application JS */
const MB = {
  apiBase: '/api/v1',
  lang: localStorage.getItem('mb_lang') || 'en',
  token: localStorage.getItem('mb_token') || null,
  user: null,
  cartCount: 0,

  // i18n
  t(en, bn) { return this.lang === 'bn' && bn ? bn : en; },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('mb_lang', lang);
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    document.querySelectorAll('[data-en]').forEach(el => {
      el.textContent = lang === 'bn' ? (el.dataset.bn || el.dataset.en) : el.dataset.en;
    });
  },

  // API
  async api(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : this.apiBase + endpoint;
    const config = { headers: { 'Content-Type': 'application/json' }, ...options };
    if (this.token) config.headers = { ...config.headers, Authorization: `Bearer ${this.token}` };
    try {
      const res = await fetch(url, config);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && !endpoint.includes('/auth/')) {
          this.logout();
          return data;
        }
        throw { status: res.status, ...data };
      }
      return data;
    } catch (err) {
      if (err.status) throw err;
      console.error('API Error:', err);
      throw { success: false, message: 'Network error' };
    }
  },

  async get(endpoint) { return this.api(endpoint); },
  async post(endpoint, body) { return this.api(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
  async put(endpoint, body) { return this.api(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
  async del(endpoint) { return this.api(endpoint, { method: 'DELETE' }); },
  async upload(endpoint, formData) {
    const config = { method: 'POST', body: formData, headers: {} };
    if (this.token) config.headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(this.apiBase + endpoint, config);
    return res.json();
  },

  // Auth
  async login(email, password) {
    const res = await this.post('/auth/login', { email, password });
    if (res.success) {
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem('mb_token', res.data.token);
      localStorage.setItem('mb_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async register(name, email, password, phone) {
    const res = await this.post('/auth/register', { name, email, password, phone });
    if (res.success) {
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem('mb_token', res.data.token);
      localStorage.setItem('mb_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/account')) {
      window.location.href = '/login';
    }
  },

  loadUser() {
    const saved = localStorage.getItem('mb_user');
    if (saved) {
      try { this.user = JSON.parse(saved); } catch { this.user = null; }
    }
    this.updateAuthUI();
  },

  isLoggedIn() { return !!this.token && !!this.user; },
  isAdmin() { return this.user?.role === 'admin'; },
  isStaff() { return ['admin', 'manager', 'pharmacist', 'cashier'].includes(this.user?.role); },

  updateAuthUI() {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;
    if (this.isLoggedIn()) {
      authArea.innerHTML = `
        <a href="/account" class="header-btn"><span class="icon">&#128100;</span><span>${this.user.name.split(' ')[0]}</span></a>
        ${this.isStaff() ? '<a href="/admin" class="header-btn"><span class="icon">&#9881;</span><span>Admin</span></a>' : ''}
        <button onclick="MB.logout()" class="header-btn"><span class="icon">&#10145;</span><span>${this.t('Logout', 'লগআউট')}</span></button>`;
    } else {
      authArea.innerHTML = `<a href="/login" class="header-btn"><span class="icon">&#128100;</span><span>${this.t('Login', 'লগইন')}</span></a>`;
    }
  },

  // Cart (local for guests, server for logged in)
  getLocalCart() {
    try { return JSON.parse(localStorage.getItem('mb_cart') || '[]'); } catch { return []; }
  },

  saveLocalCart(items) {
    localStorage.setItem('mb_cart', JSON.stringify(items));
    this.cartCount = items.length;
    this.updateCartBadge();
  },

  async addToCart(productId, quantity = 1, unit) {
    if (this.isLoggedIn()) {
      try {
        const res = await this.post('/cart/add', { productId, quantity, unit });
        if (res.success) { this.cartCount = res.data?.itemCount || this.cartCount + 1; this.updateCartBadge(); this.toast(this.t('Added to cart', 'কার্টে যোগ হয়েছে'), 'success'); }
        return res;
      } catch (err) { this.toast(err.message || 'Error', 'error'); }
    } else {
      const cart = this.getLocalCart();
      const existing = cart.find(i => i.productId === productId);
      if (existing) { existing.quantity += quantity; } else { cart.push({ productId, quantity, unit }); }
      this.saveLocalCart(cart);
      this.toast(this.t('Added to cart', 'কার্টে যোগ হয়েছে'), 'success');
    }
  },

  updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = this.cartCount;
      el.style.display = this.cartCount > 0 ? 'flex' : 'none';
    });
  },

  // Toast
  toast(message, type = 'success', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:18px;cursor:pointer;margin-left:12px;">&times;</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  // Formatting
  formatPrice(amount) { return `৳${parseFloat(amount || 0).toFixed(2)}`; },
  formatDate(date) { if (!date) return ''; return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); },

  // Product card HTML
  productCardHTML(p) {
    const discount = p.mrp && p.sellingPrice && p.sellingPrice < p.mrp ? Math.round((1 - p.sellingPrice / p.mrp) * 100) : 0;
    const inStock = (p.stockQuantity || 0) > 0;
    return `
      <div class="product-card">
        <div class="badges">
          ${discount > 0 ? `<span class="badge badge-discount">${discount}% OFF</span>` : ''}
          ${p.prescriptionRequired ? '<span class="badge badge-rx">Rx</span>' : ''}
          ${!inStock ? '<span class="badge badge-outofstock">Out of Stock</span>' : ''}
        </div>
        <a href="/product/${p.id}" class="img-wrap">
          <img src="${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" alt="${p.name}" loading="lazy" onerror="this.src='/assets/images/medicine-placeholder.svg'">
        </a>
        <div class="info">
          <a href="/product/${p.id}" class="name">${p.name}${p.strength ? ' ' + p.strength : ''}</a>
          ${p.nameBn ? `<div class="name-bn">${p.nameBn}</div>` : ''}
          ${p.genericName ? `<div class="generic">${p.genericName}</div>` : ''}
          ${p.manufacturer ? `<div class="manufacturer">${p.manufacturer}</div>` : ''}
          <div class="price-row">
            <span class="price">${MB.formatPrice(p.sellingPrice || p.mrp)}</span>
            ${discount > 0 ? `<span class="mrp">${MB.formatPrice(p.mrp)}</span>` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-primary btn-sm" onclick="MB.addToCart('${p.id}')" ${!inStock ? 'disabled' : ''}>${inStock ? MB.t('Add to Cart', 'কার্টে যোগ') : MB.t('Out of Stock', 'স্টক নেই')}</button>
          </div>
        </div>
      </div>`;
  },

  // Init
  init() {
    this.loadUser();
    this.cartCount = this.isLoggedIn() ? 0 : this.getLocalCart().length;
    this.updateCartBadge();

    // Language switcher
    document.querySelectorAll('.lang-switch button').forEach(btn => {
      btn.addEventListener('click', () => this.setLang(btn.dataset.lang));
    });
    this.setLang(this.lang);

    // Mobile menu
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.header-nav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', () => nav.classList.toggle('show'));
    }

    // Search
    this.initSearch();

    // Load cart count from server if logged in
    if (this.isLoggedIn()) {
      this.get('/cart').then(res => {
        if (res.success) { this.cartCount = res.data?.items?.length || 0; this.updateCartBadge(); }
      }).catch(() => {});
    }
  },

  initSearch() {
    const searchInput = document.getElementById('search-input');
    const suggestions = document.getElementById('search-suggestions');
    if (!searchInput || !suggestions) return;

    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = searchInput.value.trim();
      if (q.length < 1) { suggestions.classList.remove('show'); return; }
      debounce = setTimeout(async () => {
        try {
          const res = await this.get(`/search/suggestions?q=${encodeURIComponent(q)}&limit=8`);
          if (res.success && res.data.length > 0) {
            suggestions.innerHTML = res.data.map(p => `
              <a href="/product/${p.id}" class="search-suggestion-item">
                <img src="${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" alt="${p.name}" onerror="this.src='/assets/images/medicine-placeholder.svg'">
                <div class="info">
                  <div class="name">${p.name} ${p.strength || ''}</div>
                  <div class="generic">${p.genericName || ''} ${p.manufacturer ? '- ' + p.manufacturer : ''}</div>
                </div>
                <div class="price">${MB.formatPrice(p.sellingPrice || p.mrp)}</div>
              </a>`).join('') + `<a href="/search?q=${encodeURIComponent(q)}" class="search-suggestion-item" style="justify-content:center;color:var(--primary);font-weight:600;">${this.t('See all results', 'সব ফলাফল দেখুন')} &rarr;</a>`;
            suggestions.classList.add('show');
          } else {
            suggestions.innerHTML = `<div class="search-suggestion-item" style="justify-content:center;color:var(--text-muted);">${this.t('No results found', 'কোনো ফলাফল পাওয়া যায়নি')}</div>`;
            suggestions.classList.add('show');
          }
        } catch { suggestions.classList.remove('show'); }
      }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) suggestions.classList.remove('show');
    });
  },

  // Copy to clipboard
  copyText(text) {
    navigator.clipboard.writeText(text).then(() => this.toast(this.t('Copied!', 'কপি হয়েছে!'), 'success'));
  },
};

document.addEventListener('DOMContentLoaded', () => MB.init());
