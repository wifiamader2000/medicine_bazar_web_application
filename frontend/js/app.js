const MB = {
  apiBase: '/api/v1',
  lang: localStorage.getItem('mb_lang') || 'bn',
  token: localStorage.getItem('mb_token') || null,
  user: null,
  cartCount: 0,

  t(en, bn) {
    return this.lang === 'bn' && bn ? bn : en;
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('mb_lang', lang);
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    document.querySelectorAll('.lang-switch button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    document.querySelectorAll('[data-en]').forEach((el) => {
      el.textContent = lang === 'bn' ? (el.dataset.bn || el.dataset.en) : el.dataset.en;
    });
    document.querySelectorAll('[data-en-placeholder]').forEach((el) => {
      el.placeholder = lang === 'bn' ? (el.dataset.bnPlaceholder || el.dataset.enPlaceholder) : el.dataset.enPlaceholder;
    });
  },

  async api(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : this.apiBase + endpoint;
    const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    const config = { credentials: 'same-origin', ...options, headers: { ...headers, ...(options.headers || {}) } };
    if (this.token) config.headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(url, config);
    const type = res.headers.get('content-type') || '';
    const data = type.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw { status: res.status, ...(typeof data === 'object' ? data : { message: data }) };
    return data;
  },

  get(endpoint) { return this.api(endpoint); },
  post(endpoint, body) { return this.api(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
  put(endpoint, body) { return this.api(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
  del(endpoint) { return this.api(endpoint, { method: 'DELETE' }); },
  upload(endpoint, formData) { return this.api(endpoint, { method: 'POST', body: formData }); },

  loadUser() {
    try { this.user = JSON.parse(localStorage.getItem('mb_user') || 'null'); } catch { this.user = null; }
    this.updateAuthUI();
  },

  isLoggedIn() { return Boolean(this.token && this.user); },
  isStaff() { return ['admin', 'manager', 'pharmacist', 'cashier'].includes(this.user?.role); },
  accountTarget() {
    if (!this.isLoggedIn()) return { href: '/login', label: 'Login', icon: '&#128100;' };
    if (this.user?.role === 'admin') return { href: '/admin/dashboard.html', label: 'Admin Panel', icon: '&#9881;' };
    if (this.user?.role === 'cashier') return { href: '/admin/pos.html', label: 'POS', icon: '&#128179;' };
    return { href: '/account', label: 'My Account', icon: '&#128100;' };
  },

  async login(email, password) {
    const res = await this.post('/auth/login', { email, password });
    if (res.success) {
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem('mb_token', this.token);
      localStorage.setItem('mb_user', JSON.stringify(this.user));
    }
    return res;
  },

  async register(name, email, password, phone = '') {
    const res = await this.post('/auth/register', { name, email, password, phone });
    if (res.success) {
      this.token = res.data.token;
      this.user = res.data.user;
      localStorage.setItem('mb_token', this.token);
      localStorage.setItem('mb_user', JSON.stringify(this.user));
    }
    return res;
  },

  logout() {
    if (this.token) this.post('/auth/logout', {}).catch(() => {});
    this.token = null;
    this.user = null;
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    window.location.href = '/login';
  },

  updateAuthUI() {
    const authArea = document.getElementById('auth-area');
    if (!authArea) return;
    const target = this.accountTarget();
    authArea.innerHTML = `<a href="${target.href}" class="header-pill"><span class="icon">${target.icon}</span><span>${target.label}</span></a>`;
  },

  getLocalCart() {
    try { return JSON.parse(localStorage.getItem('mb_cart') || '[]'); } catch { return []; }
  },

  saveLocalCart(items) {
    localStorage.setItem('mb_cart', JSON.stringify(items));
    this.cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    this.updateCartBadge();
  },

  async addToCart(productId, quantity = 1, unit = '') {
    if (this.isLoggedIn()) {
      try {
        const res = await this.post('/cart/add', { productId, quantity, unit });
        if (res.success) {
          this.cartCount = res.data?.itemCount || this.cartCount + quantity;
          this.updateCartBadge();
          this.toast(this.t('Added to cart', 'কার্টে যোগ হয়েছে'), 'success');
        }
        return res;
      } catch (err) {
        this.toast(err.message || 'Could not add to cart', 'error');
        return null;
      }
    }
    const cart = this.getLocalCart();
    const existing = cart.find((item) => item.productId === productId);
    if (existing) existing.quantity += quantity;
    else cart.push({ productId, quantity, unit });
    this.saveLocalCart(cart);
    this.toast(this.t('Added to cart', 'কার্টে যোগ হয়েছে'), 'success');
    return { success: true };
  },

  updateCartBadge() {
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = this.cartCount;
      el.style.display = this.cartCount > 0 ? 'flex' : 'none';
    });
  },

  toast(message, type = 'success', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" aria-label="Close">&times;</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  formatPrice(amount) {
    return `৳${Number(amount || 0).toFixed(2)}`;
  },

  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString(this.lang === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  productCardHTML(p) {
    const price = p.sellingPrice || p.mrp || 0;
    const discount = p.mrp && p.sellingPrice && p.sellingPrice < p.mrp ? Math.round((1 - p.sellingPrice / p.mrp) * 100) : 0;
    const inStock = (p.stockQuantity || 0) > 0;
    return `
      <article class="product-card">
        <div class="badges">
          ${discount ? `<span class="badge badge-discount">${discount}% OFF</span>` : ''}
          ${p.prescriptionRequired ? '<span class="badge badge-rx">Rx Required</span>' : ''}
          ${inStock ? '<span class="badge badge-stock">In Stock</span>' : '<span class="badge badge-outofstock">Out of Stock</span>'}
        </div>
        <a href="/product/${p.id}" class="img-wrap">
          <img src="${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" alt="${p.name || 'Medicine'}" loading="lazy" onerror="this.src='/assets/images/medicine-placeholder.svg'">
        </a>
        <div class="info">
          <a href="/product/${p.id}" class="name">${p.name || 'Medicine'} ${p.strength || ''}</a>
          ${p.nameBn ? `<div class="name-bn">${p.nameBn}</div>` : ''}
          ${p.genericName ? `<div class="generic">${p.genericName}</div>` : ''}
          <div class="strength">${[p.dosageForm, p.packSize].filter(Boolean).join(' | ')}</div>
          ${p.manufacturer ? `<div class="manufacturer">${p.manufacturer}</div>` : ''}
          <div class="price-row">
            <span class="price">${this.formatPrice(price)}</span>
            ${discount ? `<span class="mrp">${this.formatPrice(p.mrp)}</span>` : ''}
          </div>
          <div class="actions">
            <button class="btn btn-primary btn-sm" onclick="MB.addToCart('${p.id}')" ${!inStock ? 'disabled' : ''}>${inStock ? this.t('Add to Cart', 'কার্টে যোগ') : this.t('Out of Stock', 'স্টক নেই')}</button>
            <a class="btn btn-outline btn-sm" href="/product/${p.id}">${this.t('Quick View', 'দেখুন')}</a>
          </div>
          ${p.genericName ? `<a class="alternative-link" href="/search?q=${encodeURIComponent(p.genericName)}">${this.t('Alternatives', 'বিকল্প')}</a>` : ''}
        </div>
      </article>`;
  },

  goSearch() {
    const q = document.getElementById('search-input')?.value.trim();
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
  },

  initSearch() {
    const input = document.getElementById('search-input');
    const suggestions = document.getElementById('search-suggestions');
    if (!input || !suggestions) return;
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) {
        suggestions.classList.remove('show');
        return;
      }
      timer = setTimeout(async () => {
        try {
          const res = await this.get(`/search/suggestions?q=${encodeURIComponent(q)}&limit=8`);
          const popular = q.toLowerCase() === 'na' ? [
            ['Napa', 'Napa'],
            ['Napa Extra', 'Napa Extra'],
            ['Napa Extend', 'Napa Extend'],
            ['Napa Syrup', 'Napa Syrup'],
            ['Paracetamol', 'Paracetamol'],
            ['fever', 'Fever related medicine'],
          ] : [];
          const mark = (text = '') => String(text).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
          const popularHtml = popular.map(([value, label]) => `<a href="/search?q=${encodeURIComponent(value)}" class="search-suggestion-item search-popular"><span>${mark(label)}</span></a>`).join('');
          const productHtml = (res.data || []).map((p) => `
            <a href="${p.href || (p.type === 'product' ? '/product/' + p.id : '/search?q=' + encodeURIComponent(p.name || p.label || q))}" class="search-suggestion-item">
              ${p.type === 'product' ? `<img src="${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" alt="${p.name}" onerror="this.src='/assets/images/medicine-placeholder.svg'">` : '<span class="suggestion-type-icon">&#128269;</span>'}
              <div class="info"><div class="name">${mark(p.label || p.name || '')} <small>${p.type && p.type !== 'product' ? p.type.replace('_', ' ') : ''}</small></div><div class="generic">${mark([p.genericName, p.manufacturer, p.drugClass, p.indication].filter(Boolean).join(' - '))}</div></div>
              <div class="price">${p.type === 'product' ? this.formatPrice(p.sellingPrice || p.mrp) : '&rarr;'}</div>
            </a>`).join('');
          suggestions.innerHTML = `<div class="search-overlay-grid"><div class="search-overlay-side"><strong>${this.t('Trending', 'জনপ্রিয়')}</strong>${popularHtml || ['Napa', 'Paracetamol', 'Fever', 'Diabetes'].map(v => `<a href="/search?q=${encodeURIComponent(v)}">${v}</a>`).join('')}</div><div class="search-overlay-results">` + (productHtml
            ? productHtml + `<a href="/search?q=${encodeURIComponent(q)}" class="search-suggestion-item see-all">${this.t('See all results', 'সব ফলাফল দেখুন')} &rarr;</a></div></div>`
            : `<div class="search-suggestion-item muted">${this.t('No results found', 'কোনো ফলাফল পাওয়া যায়নি')}</div></div></div>`);
          suggestions.classList.add('show');
        } catch {
          suggestions.classList.remove('show');
        }
      }, 220);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.goSearch();
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.search-bar')) suggestions.classList.remove('show');
    });
  },

  copyText(text) {
    navigator.clipboard.writeText(text).then(() => this.toast(this.t('Copied!', 'কপি হয়েছে!'), 'success'));
  },

  init() {
    this.loadUser();
    this.cartCount = this.getLocalCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
    this.updateCartBadge();
    document.querySelectorAll('.lang-switch button').forEach((btn) => btn.addEventListener('click', () => this.setLang(btn.dataset.lang)));
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => document.querySelector('.header-nav')?.classList.toggle('show'));
    this.setLang(this.lang);
    this.initSearch();
    if (this.isLoggedIn()) {
      this.get('/cart').then((res) => {
        this.cartCount = res.data?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || this.cartCount;
        this.updateCartBadge();
      }).catch(() => {});
    }
  },
};

document.addEventListener('DOMContentLoaded', () => MB.init());
