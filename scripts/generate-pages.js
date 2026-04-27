const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../frontend/pages');
if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

function wrap(title, titleBn, bodyContent, extraScripts = '', extraHead = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Medicine Bazar</title>
  <link rel="icon" href="/assets/images/medicine-placeholder.svg">
  <link rel="stylesheet" href="/css/style.css">
  ${extraHead}
</head>
<body>
  <header class="header">
    <div class="header-top"><div class="container"><div><span data-en="Need Help?" data-bn="সাহায্য দরকার?">Need Help?</span> <a href="tel:01602444532">01602444532</a></div><div style="display:flex;align-items:center;gap:16px;"><div class="lang-switch"><button data-lang="en" class="active">EN</button><button data-lang="bn">বাং</button></div></div></div></div>
    <div class="header-main"><div class="container">
      <a href="/" class="logo"><img src="/assets/images/medicine-placeholder.svg" alt="Medicine Bazar"><div class="logo-text"><span data-en="Medicine Bazar" data-bn="মেডিসিন বাজার">Medicine Bazar</span><small data-en="Your Trusted Pharmacy" data-bn="আপনার বিশ্বস্ত ফার্মেসি">Your Trusted Pharmacy</small></div></a>
      <div class="search-bar"><input type="text" id="search-input" placeholder="Search medicines..."><button onclick="document.getElementById('search-input').value&&(window.location.href='/search?q='+encodeURIComponent(document.getElementById('search-input').value))">&#128269;</button><div id="search-suggestions" class="search-suggestions"></div></div>
      <div class="header-actions"><div id="auth-area"></div><a href="/cart" class="header-btn"><span class="icon">&#128722;</span><span>Cart</span><span class="cart-count" style="display:none">0</span></a><button class="mobile-menu-btn">&#9776;</button></div>
    </div></div>
    <nav class="header-nav"><div class="container"><a href="/" class="nav-link">Home</a><a href="/shop" class="nav-link">Shop</a><a href="/prescription-upload" class="nav-link">Upload Prescription</a><a href="/lab-tests" class="nav-link">Lab Tests</a><a href="/blog" class="nav-link">Health Blog</a><a href="/about" class="nav-link">About</a><a href="/contact" class="nav-link">Contact</a></div></nav>
  </header>
  ${bodyContent}
  <footer class="footer"><div class="container"><div class="footer-grid"><div class="footer-col"><h3>Medicine Bazar</h3><p>Your trusted pharmacy partner.</p><div class="footer-social"><a href="https://facebook.com/medicinebazar24" target="_blank">f</a><a href="https://www.youtube.com/@MedicineBazar24" target="_blank">&#9654;</a><a href="https://wa.me/8801602444532" target="_blank">W</a></div></div><div class="footer-col"><h3>Quick Links</h3><a href="/shop">Shop</a><a href="/prescription-upload">Upload Prescription</a><a href="/lab-tests">Lab Tests</a><a href="/blog">Health Blog</a></div><div class="footer-col"><h3>Policies</h3><a href="/about">About Us</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms</a><a href="/return">Return Policy</a><a href="/faq">FAQ</a></div><div class="footer-col"><h3>Contact</h3><p>&#128222; 01602444532</p><p><a href="https://wa.me/8801602444532" target="_blank" style="color:rgba(255,255,255,0.7);">WhatsApp</a></p></div></div></div><div class="footer-bottom"><div class="container">&copy; 2024 Medicine Bazar. All rights reserved.</div></div><div class="footer-disclaimer"><div class="container">Disclaimer: Always consult your doctor before taking any medicine.</div></div></footer>
  <div class="whatsapp-float"><a href="https://wa.me/8801602444532" target="_blank">&#128172;</a></div>
  <script src="/js/app.js"></script>
  ${extraScripts}
</body>
</html>`;
}

// SHOP PAGE
fs.writeFileSync(path.join(pagesDir, 'shop.html'), wrap('Shop', 'শপ', `
  <section class="section"><div class="container">
    <div class="section-header"><div><h2 class="section-title" data-en="All Medicines" data-bn="সকল ওষুধ">All Medicines</h2><p class="section-subtitle" id="result-count" style="color:var(--text-muted);"></p></div></div>
    <div class="shop-filters" style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;">
      <select id="filter-category" class="form-control" style="max-width:180px;"><option value="" data-en="All Categories" data-bn="সকল ক্যাটাগরি">All Categories</option></select>
      <select id="filter-brand" class="form-control" style="max-width:180px;"><option value="" data-en="All Brands" data-bn="সকল ব্র্যান্ড">All Brands</option></select>
      <select id="filter-form" class="form-control" style="max-width:160px;"><option value="">All Forms</option></select>
      <select id="filter-sort" class="form-control" style="max-width:180px;">
        <option value="">Sort By</option><option value="name:asc">Name A-Z</option><option value="name:desc">Name Z-A</option>
        <option value="sellingPrice:asc">Price Low-High</option><option value="sellingPrice:desc">Price High-Low</option>
        <option value="soldCount:desc">Best Selling</option>
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px;white-space:nowrap;"><input type="checkbox" id="filter-stock"> <span data-en="In Stock" data-bn="স্টকে আছে">In Stock</span></label>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px;white-space:nowrap;"><input type="checkbox" id="filter-rx"> <span data-en="Rx Only" data-bn="প্রেসক্রিপশন">Rx Only</span></label>
      <button id="clear-filters" class="btn btn-outline btn-sm" style="display:none;" data-en="Clear Filters" data-bn="ফিল্টার মুছুন">Clear Filters</button>
    </div>
    <div id="products-grid" class="products-grid"><div class="loading"><div class="spinner"></div></div></div>
    <div id="pagination" class="pagination"></div>
  </div></section>`, `<script>
  let currentPage = 1;
  async function loadProducts(page = 1) {
    currentPage = page;
    const cat = document.getElementById('filter-category').value;
    const brand = document.getElementById('filter-brand').value;
    const sort = document.getElementById('filter-sort').value;
    const inStock = document.getElementById('filter-stock').checked;
    const rx = document.getElementById('filter-rx').checked;
    let url = '/products?page=' + page + '&limit=24';
    if (cat) url += '&category=' + encodeURIComponent(cat);
    if (brand) url += '&brand=' + encodeURIComponent(brand);
    if (sort) url += '&sort=' + sort;
    if (inStock) url += '&inStock=true';
    if (rx) url += '&prescriptionRequired=true';
    const hasFilter = cat || brand || sort || inStock || rx;
    document.getElementById('clear-filters').style.display = hasFilter ? '' : 'none';
    const res = await MB.get(url);
    if (res.success) {
      document.getElementById('result-count').textContent = res.pagination.total + ' ' + MB.t('medicines found', 'টি ওষুধ পাওয়া গেছে');
      document.getElementById('products-grid').innerHTML = res.data.length > 0 ? res.data.map(p => MB.productCardHTML(p)).join('') : '<div class="empty-state"><h3>' + MB.t('No products found', 'কোনো পণ্য পাওয়া যায়নি') + '</h3></div>';
      const { total, totalPages } = res.pagination;
      let pag = '';
      if (totalPages > 1) {
        if (page > 1) pag += '<button onclick="loadProducts(' + (page - 1) + ')">&laquo;</button>';
        const start = Math.max(1, page - 3); const end = Math.min(totalPages, page + 3);
        if (start > 1) { pag += '<button onclick="loadProducts(1)">1</button>'; if (start > 2) pag += '<button disabled>...</button>'; }
        for (let i = start; i <= end; i++) pag += '<button class="' + (i === page ? 'active' : '') + '" onclick="loadProducts(' + i + ')">' + i + '</button>';
        if (end < totalPages) { if (end < totalPages - 1) pag += '<button disabled>...</button>'; pag += '<button onclick="loadProducts(' + totalPages + ')">' + totalPages + '</button>'; }
        if (page < totalPages) pag += '<button onclick="loadProducts(' + (page + 1) + ')">&raquo;</button>';
      }
      document.getElementById('pagination').innerHTML = pag;
    }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const cats = await MB.get('/categories');
    if (cats.success) { const sel = document.getElementById('filter-category'); cats.data.forEach(c => { const o = document.createElement('option'); o.value = c.name; o.textContent = c.name; sel.appendChild(o); }); }
    try { const brands = await MB.get('/products/brands'); if (brands.success) { const sel = document.getElementById('filter-brand'); brands.data.forEach(b => { const o = document.createElement('option'); o.value = b.name; o.textContent = b.name + ' (' + b.count + ')'; sel.appendChild(o); }); } } catch(e) {}
    ['filter-category','filter-brand','filter-sort','filter-form'].forEach(id => document.getElementById(id).addEventListener('change', () => loadProducts(1)));
    ['filter-stock','filter-rx'].forEach(id => document.getElementById(id).addEventListener('change', () => loadProducts(1)));
    document.getElementById('clear-filters').addEventListener('click', () => {
      ['filter-category','filter-brand','filter-sort','filter-form'].forEach(id => document.getElementById(id).value = '');
      ['filter-stock','filter-rx'].forEach(id => document.getElementById(id).checked = false);
      loadProducts(1);
    });
    loadProducts(1);
  });
</script>`));

// SEARCH PAGE
fs.writeFileSync(path.join(pagesDir, 'search.html'), wrap('Search', 'অনুসন্ধান', `
  <section class="section"><div class="container">
    <h2 class="section-title" id="search-title" data-en="Search Results" data-bn="অনুসন্ধান ফলাফল">Search Results</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <select id="search-sort" class="form-control" style="max-width:180px;"><option value="">Sort By</option><option value="name:asc">Name A-Z</option><option value="sellingPrice:asc">Price Low-High</option><option value="sellingPrice:desc">Price High-Low</option></select>
      <select id="search-category" class="form-control" style="max-width:180px;"><option value="">All Categories</option></select>
      <span id="search-count" style="color:var(--text-muted);font-size:14px;"></span>
    </div>
    <div id="popular-searches" style="margin-bottom:20px;">
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:8px;" data-en="Popular searches:" data-bn="জনপ্রিয় অনুসন্ধান:">Popular searches:</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="/search?q=Napa" class="filter-tag">Napa</a><a href="/search?q=Paracetamol" class="filter-tag">Paracetamol</a>
        <a href="/search?q=Omeprazole" class="filter-tag">Omeprazole</a><a href="/search?q=Amoxicillin" class="filter-tag">Amoxicillin</a>
        <a href="/search?q=Vitamin" class="filter-tag">Vitamin</a><a href="/search?q=Metformin" class="filter-tag">Metformin</a>
      </div>
    </div>
    <div id="search-results" class="products-grid"><div class="empty-state"><h3 data-en="Enter a search term to find medicines" data-bn="ওষুধ খুঁজতে সার্চ করুন">Enter a search term to find medicines</h3></div></div>
    <div id="pagination" class="pagination"></div>
  </div></section>`, `<script>
  let currentQuery = '', currentPage = 1;
  function doSearch(page) {
    const q = document.getElementById('search-input').value.trim();
    if (q) { window.history.replaceState({}, '', '/search?q=' + encodeURIComponent(q)); performSearch(q, page || 1); }
  }
  async function performSearch(q, page) {
    currentQuery = q; currentPage = page || 1;
    document.getElementById('search-title').textContent = MB.t('Search: "' + q + '"', 'অনুসন্ধান: "' + q + '"');
    const sort = document.getElementById('search-sort').value;
    const cat = document.getElementById('search-category').value;
    let url = '/products?search=' + encodeURIComponent(q) + '&page=' + currentPage + '&limit=24';
    if (sort) url += '&sort=' + sort;
    if (cat) url += '&category=' + encodeURIComponent(cat);
    const res = await MB.get(url);
    if (res.success) {
      document.getElementById('search-count').textContent = res.pagination.total + ' ' + MB.t('results', 'ফলাফল');
      document.getElementById('popular-searches').style.display = res.data.length > 0 ? 'none' : '';
      document.getElementById('search-results').innerHTML = res.data.length > 0 ? res.data.map(p => MB.productCardHTML(p)).join('') : '<div class="empty-state"><h3>' + MB.t('No results for "' + q + '"', '"' + q + '" এর জন্য কোনো ফলাফল নেই') + '</h3><p>' + MB.t('Try different keywords or browse categories', 'অন্য কীওয়ার্ড চেষ্টা করুন') + '</p></div>';
      const { totalPages } = res.pagination;
      let pag = '';
      if (totalPages > 1) {
        if (currentPage > 1) pag += '<button onclick="performSearch(currentQuery,' + (currentPage - 1) + ')">&laquo;</button>';
        for (let i = Math.max(1, currentPage - 3); i <= Math.min(totalPages, currentPage + 3); i++) pag += '<button class="' + (i === currentPage ? 'active' : '') + '" onclick="performSearch(currentQuery,' + i + ')">' + i + '</button>';
        if (currentPage < totalPages) pag += '<button onclick="performSearch(currentQuery,' + (currentPage + 1) + ')">&raquo;</button>';
      }
      document.getElementById('pagination').innerHTML = pag;
    }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    try { const cats = await MB.get('/categories'); if (cats.success) { const sel = document.getElementById('search-category'); cats.data.forEach(c => { const o = document.createElement('option'); o.value = c.name; o.textContent = c.name; sel.appendChild(o); }); } } catch(e) {}
    document.getElementById('search-sort').addEventListener('change', () => { if (currentQuery) performSearch(currentQuery, 1); });
    document.getElementById('search-category').addEventListener('change', () => { if (currentQuery) performSearch(currentQuery, 1); });
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { document.getElementById('search-input').value = q; performSearch(q, 1); }
  });
</script>`));

// PRODUCT DETAIL
fs.writeFileSync(path.join(pagesDir, 'product-detail.html'), wrap('Product Detail', 'পণ্যের বিবরণ', `
  <section class="section"><div class="container">
    <div id="breadcrumb" style="font-size:14px;margin-bottom:16px;color:var(--text-muted);"><a href="/" style="color:var(--text-muted);">Home</a> &rsaquo; <a href="/shop" style="color:var(--text-muted);">Shop</a> &rsaquo; <span id="bc-name">...</span></div>
    <div id="product-detail"><div class="loading"><div class="spinner"></div></div></div>
    <div id="product-tabs" style="margin-top:32px;"></div>
    <div id="alternatives" style="margin-top:32px;"></div>
    <div id="related" style="margin-top:32px;"></div>
  </div></section>`, `
  <style>.product-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; } @media (max-width: 768px) { .product-detail-grid { grid-template-columns: 1fr; } } .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; margin: 12px 0; } .info-grid dt { color: var(--text-muted); } .info-grid dd { font-weight: 600; margin: 0; } .tab-btns { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 16px; } .tab-btns button { background: none; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; } .tab-btns button.active { color: var(--primary); border-bottom-color: var(--primary); } .tab-content { display: none; } .tab-content.active { display: block; }</style>
  <script>
  function showTab(name) {
    document.querySelectorAll('.tab-btns button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + name));
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const id = window.location.pathname.split('/').pop();
    const res = await MB.get('/products/' + id);
    if (!res.success) { document.getElementById('product-detail').innerHTML = '<div class="empty-state"><h3>' + MB.t('Product not found', 'পণ্য পাওয়া যায়নি') + '</h3><a href="/shop" class="btn btn-primary">Back to Shop</a></div>'; return; }
    const p = res.data;
    const discount = p.mrp && p.sellingPrice && p.sellingPrice < p.mrp ? Math.round((1 - p.sellingPrice / p.mrp) * 100) : 0;
    document.title = p.name + ' - Medicine Bazar';
    document.getElementById('bc-name').textContent = p.name;
    document.getElementById('product-detail').innerHTML = \`
      <div class="product-detail-grid">
        <div class="card" style="text-align:center;padding:32px;">
          <img src="\${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" alt="\${p.name}" style="max-width:300px;max-height:300px;" onerror="this.src='/assets/images/medicine-placeholder.svg'">
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            \${discount > 0 ? '<span class="badge badge-discount">' + discount + '% OFF</span>' : ''}
            \${p.prescriptionRequired ? '<span class="badge badge-rx">Rx Required</span>' : '<span class="badge" style="background:#14B8A6;color:#fff;">OTC</span>'}
          </div>
        </div>
        <div>
          <h1 style="font-size:28px;margin-bottom:4px;">\${p.name} \${p.strength || ''}</h1>
          \${p.nameBn ? '<p style="font-size:18px;color:var(--text-secondary);margin-bottom:8px;">' + p.nameBn + '</p>' : ''}
          <dl class="info-grid">
            \${p.genericName ? '<dt>Generic Name</dt><dd>' + p.genericName + '</dd>' : ''}
            \${p.manufacturer ? '<dt>Manufacturer</dt><dd>' + p.manufacturer + '</dd>' : ''}
            \${p.dosageForm ? '<dt>Dosage Form</dt><dd>' + p.dosageForm + '</dd>' : ''}
            \${p.strength ? '<dt>Strength</dt><dd>' + p.strength + '</dd>' : ''}
            \${p.packSize ? '<dt>Pack Size</dt><dd>' + p.packSize + '</dd>' : ''}
            \${p.category ? '<dt>Category</dt><dd><a href="/category/' + (p.categorySlug || p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '">' + p.category + '</a></dd>' : ''}
          </dl>
          <div style="background:var(--panel);border-radius:var(--radius);padding:16px;margin:16px 0;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:32px;font-weight:700;color:var(--primary);">\${MB.formatPrice(p.sellingPrice || p.mrp)}</span>
              \${discount > 0 ? '<span style="font-size:18px;text-decoration:line-through;color:var(--text-muted);">' + MB.formatPrice(p.mrp) + '</span>' : ''}
            </div>
            <div style="margin-top:8px;font-size:14px;">\${(p.stockQuantity || 0) > 0 ? '<span style="color:var(--primary);">In Stock (' + p.stockQuantity + ' available)</span>' : '<span style="color:var(--alert-red);">Out of Stock</span>'}</div>
          </div>
          \${p.prescriptionRequired ? '<div class="alert alert-warning" style="margin-bottom:12px;">Prescription required for this medicine</div>' : ''}
          <div style="display:flex;gap:10px;margin:20px 0;flex-wrap:wrap;">
            <button class="btn btn-primary btn-lg" onclick="MB.addToCart('\${p.id}')" \${(p.stockQuantity || 0) <= 0 ? 'disabled' : ''}>&#128722; \${MB.t('Add to Cart', 'কার্টে যোগ করুন')}</button>
            \${p.prescriptionRequired ? '<a href="/prescription-upload" class="btn btn-outline btn-lg">&#128196; ' + MB.t('Upload Prescription', 'প্রেসক্রিপশন আপলোড') + '</a>' : ''}
          </div>
          <div class="alert alert-info" style="font-size:13px;">This information is for reference only. Always consult your doctor or pharmacist.</div>
        </div>
      </div>\`;
    // Tabs
    let tabs = '<div class="tab-btns">';
    let tabContents = '';
    if (p.uses || p.dosage) { tabs += '<button class="active" data-tab="info" onclick="showTab(\\'info\\')">Information</button>'; tabContents += '<div class="tab-content active" id="tab-info" style="line-height:1.8;">' + (p.uses ? '<p><strong>Uses:</strong> ' + p.uses + '</p>' : '') + (p.dosage ? '<p><strong>Dosage:</strong> ' + p.dosage + '</p>' : '') + '</div>'; }
    if (p.sideEffects || p.warning || p.storage) { const isFirst = !p.uses && !p.dosage; tabs += '<button ' + (isFirst ? 'class="active"' : '') + ' data-tab="safety" onclick="showTab(\\'safety\\')">Safety</button>'; tabContents += '<div class="tab-content ' + (isFirst ? 'active' : '') + '" id="tab-safety" style="line-height:1.8;">' + (p.sideEffects ? '<p><strong>Side Effects:</strong> ' + p.sideEffects + '</p>' : '') + (p.warning ? '<p style="color:var(--alert-red);"><strong>Warning:</strong> ' + p.warning + '</p>' : '') + (p.storage ? '<p><strong>Storage:</strong> ' + p.storage + '</p>' : '') + '</div>'; }
    tabs += '</div>';
    if (tabContents) document.getElementById('product-tabs').innerHTML = '<div class="card" style="padding:24px;">' + tabs + tabContents + '</div>';
    if (p.alternatives && p.alternatives.length > 0) {
      document.getElementById('alternatives').innerHTML = '<h2 class="section-title">' + MB.t('Alternatives', 'বিকল্প ওষুধ') + '</h2><div class="products-grid">' + p.alternatives.map(a => MB.productCardHTML(a)).join('') + '</div>';
    }
    if (p.related && p.related.length > 0) {
      document.getElementById('related').innerHTML = '<h2 class="section-title">' + MB.t('Related Products', 'সম্পর্কিত পণ্য') + '</h2><div class="products-grid">' + p.related.map(a => MB.productCardHTML(a)).join('') + '</div>';
    }
  });
</script>`));

// CATEGORY PAGE
fs.writeFileSync(path.join(pagesDir, 'category.html'), wrap('Category', 'ক্যাটাগরি', `
  <section class="section"><div class="container">
    <h2 class="section-title" id="cat-title">Category</h2>
    <div id="products-grid" class="products-grid"><div class="loading"><div class="spinner"></div></div></div>
  </div></section>`, `<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = window.location.pathname.split('/').pop();
    document.getElementById('cat-title').textContent = slug.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
    const res = await MB.get('/products?category=' + encodeURIComponent(slug) + '&limit=60');
    if (res.success) {
      document.getElementById('products-grid').innerHTML = res.data.length > 0 ? res.data.map(p => MB.productCardHTML(p)).join('') : '<div class="empty-state"><h3>No products in this category</h3></div>';
    }
  });
</script>`));

// BRAND PAGE
fs.writeFileSync(path.join(pagesDir, 'brand.html'), wrap('Brand', 'ব্র্যান্ড', `
  <section class="section"><div class="container">
    <h2 class="section-title" id="brand-title">Brand</h2>
    <div id="products-grid" class="products-grid"><div class="loading"><div class="spinner"></div></div></div>
  </div></section>`, `<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = window.location.pathname.split('/').pop();
    document.getElementById('brand-title').textContent = slug.replace(/-/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
    const res = await MB.get('/products?brand=' + encodeURIComponent(slug) + '&limit=60');
    if (res.success) {
      document.getElementById('products-grid').innerHTML = res.data.length > 0 ? res.data.map(p => MB.productCardHTML(p)).join('') : '<div class="empty-state"><h3>No products from this brand</h3></div>';
    }
  });
</script>`));

// CART PAGE
fs.writeFileSync(path.join(pagesDir, 'cart.html'), wrap('Cart', 'কার্ট', `
  <section class="section"><div class="container">
    <h2 class="section-title" data-en="Shopping Cart" data-bn="শপিং কার্ট">Shopping Cart</h2>
    <div id="cart-content"><div class="loading"><div class="spinner"></div></div></div>
  </div></section>`, `<script>
  async function loadCart() {
    if (!MB.isLoggedIn()) {
      const local = MB.getLocalCart();
      if (local.length === 0) { document.getElementById('cart-content').innerHTML = '<div class="empty-state"><div class="icon">&#128722;</div><h3>Your cart is empty</h3><a href="/shop" class="btn btn-primary">Start Shopping</a></div>'; return; }
      document.getElementById('cart-content').innerHTML = '<div class="alert alert-info">Please <a href="/login">login</a> to manage your cart and checkout.</div>';
      return;
    }
    const res = await MB.get('/cart');
    if (!res.success || !res.data.items || res.data.items.length === 0) {
      document.getElementById('cart-content').innerHTML = '<div class="empty-state"><div class="icon">&#128722;</div><h3>Your cart is empty</h3><a href="/shop" class="btn btn-primary">Start Shopping</a></div>';
      return;
    }
    const items = res.data.items;
    let html = '<div class="card"><table class="table-wrap"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>';
    items.forEach(item => {
      html += '<tr><td><div style="display:flex;align-items:center;gap:10px;"><img src="' + (item.imageUrl || '/assets/images/medicine-placeholder.svg') + '" style="width:50px;height:50px;object-fit:contain;border-radius:4px;"><div><strong>' + item.name + '</strong><br><small>' + (item.genericName || '') + '</small></div></div></td><td>' + MB.formatPrice(item.price) + '</td><td><input type="number" value="' + item.quantity + '" min="1" max="99" style="width:60px;" class="form-control" onchange="updateQty(\\'' + item.productId + '\\', this.value)"></td><td><strong>' + MB.formatPrice(item.total) + '</strong></td><td><button class="btn btn-sm btn-danger" onclick="removeItem(\\'' + item.productId + '\\')">&#10005;</button></td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;flex-wrap:wrap;gap:12px;"><div style="font-size:24px;font-weight:700;">Total: ' + MB.formatPrice(res.data.total) + '</div><div style="display:flex;gap:10px;"><button class="btn btn-outline" onclick="clearCart()">Clear Cart</button><a href="/checkout" class="btn btn-primary btn-lg">Proceed to Checkout</a></div></div>';
    document.getElementById('cart-content').innerHTML = html;
  }
  async function updateQty(pid, qty) { await MB.put('/cart/update', { productId: pid, quantity: parseInt(qty) }); loadCart(); }
  async function removeItem(pid) { await MB.del('/cart/remove/' + pid); loadCart(); }
  async function clearCart() { await MB.del('/cart/clear'); loadCart(); }
  document.addEventListener('DOMContentLoaded', loadCart);
</script>`));

// CHECKOUT PAGE
fs.writeFileSync(path.join(pagesDir, 'checkout.html'), wrap('Checkout', 'চেকআউট', `
  <section class="section"><div class="container">
    <h2 class="section-title">Checkout</h2>
    <div id="checkout-content">
      <div style="display:grid;grid-template-columns:1fr 380px;gap:24px;">
        <div>
          <div class="card" style="margin-bottom:16px;"><h3 style="margin-bottom:12px;">Shipping Address</h3>
            <div class="form-group"><label>Full Name</label><input type="text" id="co-name" class="form-control" required></div>
            <div class="form-group"><label>Phone</label><input type="tel" id="co-phone" class="form-control" required></div>
            <div class="form-group"><label>Address</label><textarea id="co-address" class="form-control" rows="3" required></textarea></div>
            <div class="form-group"><label>City/District</label><input type="text" id="co-city" class="form-control"></div>
          </div>
          <div class="card"><h3 style="margin-bottom:12px;">Payment Method</h3>
            <div id="payment-methods"></div>
            <div id="payment-details" style="margin-top:12px;display:none;">
              <div class="alert alert-info" id="payment-instruction"></div>
              <div class="form-group"><label>Transaction ID</label><input type="text" id="co-txid" class="form-control" placeholder="Enter transaction ID"></div>
            </div>
            <div class="form-group" style="margin-top:12px;"><label>Coupon Code</label><div style="display:flex;gap:8px;"><input type="text" id="co-coupon" class="form-control" placeholder="Enter coupon code"><button class="btn btn-outline btn-sm" onclick="applyCoupon()">Apply</button></div></div>
            <div class="form-group"><label>Order Note</label><textarea id="co-note" class="form-control" rows="2" placeholder="Any special instructions..."></textarea></div>
          </div>
        </div>
        <div class="card" style="position:sticky;top:80px;align-self:start;">
          <h3 style="margin-bottom:12px;">Order Summary</h3>
          <div id="order-summary"><div class="loading"><div class="spinner"></div></div></div>
          <button class="btn btn-primary btn-block btn-lg" style="margin-top:16px;" onclick="placeOrder()">Place Order</button>
        </div>
      </div>
    </div>
  </div></section>`, `<script>
  let cartData = null, selectedPayment = 'cod';
  document.addEventListener('DOMContentLoaded', async () => {
    if (!MB.isLoggedIn()) { window.location.href = '/login?redirect=/checkout'; return; }
    const res = await MB.get('/cart');
    if (!res.success || !res.data.items || res.data.items.length === 0) { window.location.href = '/cart'; return; }
    cartData = res.data;
    document.getElementById('co-name').value = MB.user.name || '';
    let summaryHtml = '';
    cartData.items.forEach(item => { summaryHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>' + item.name + ' x' + item.quantity + '</span><span>' + MB.formatPrice(item.total) + '</span></div>'; });
    const delivery = cartData.total >= 500 ? 0 : 60;
    summaryHtml += '<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;"><span>Delivery</span><span>' + (delivery === 0 ? 'Free' : MB.formatPrice(delivery)) + '</span></div>';
    summaryHtml += '<div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:700;border-top:2px solid var(--border);"><span>Total</span><span>' + MB.formatPrice(cartData.total + delivery) + '</span></div>';
    document.getElementById('order-summary').innerHTML = summaryHtml;
    const pmRes = await MB.get('/payment-methods');
    if (pmRes.success) {
      let pmHtml = '';
      const methods = [['cod','Cash on Delivery','ক্যাশ অন ডেলিভারি'],['nagad','Nagad - 01602444532','নগদ'],['bkash','bKash - 01602444532','বিকাশ'],['upay','Upay - 01602444532','উপে'],['merchant','Merchant - 01940826276','মার্চেন্ট']];
      methods.forEach(([key,name]) => { pmHtml += '<div class="payment-option' + (key === 'cod' ? ' selected' : '') + '" onclick="selectPayment(\\'' + key + '\\')" data-method="' + key + '"><div class="name">' + name + '</div></div>'; });
      pmHtml += '<div class="payment-option" onclick="window.open(\\'https://shop.bkash.com/bismillah-store01940826276/paymentlink\\',\\'_blank\\')"><div class="name">bKash Payment Link &#128279;</div></div>';
      document.getElementById('payment-methods').innerHTML = pmHtml;
    }
  });
  function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-option').forEach(el => el.classList.toggle('selected', el.dataset.method === method));
    const details = document.getElementById('payment-details');
    if (method !== 'cod') {
      details.style.display = 'block';
      const numbers = { nagad: '01602444532', bkash: '01602444532', upay: '01602444532', merchant: '01940826276' };
      document.getElementById('payment-instruction').innerHTML = 'Send payment to: <strong>' + (numbers[method] || '') + '</strong> <button class="copy-btn" onclick="MB.copyText(\\'' + (numbers[method] || '') + '\\')">Copy</button><br>Then enter the Transaction ID below.';
    } else { details.style.display = 'none'; }
  }
  function applyCoupon() { MB.toast('Coupon will be applied at order placement', 'info'); }
  async function placeOrder() {
    const name = document.getElementById('co-name').value;
    const phone = document.getElementById('co-phone').value;
    const address = document.getElementById('co-address').value;
    if (!name || !phone || !address) { MB.toast('Please fill shipping details', 'error'); return; }
    try {
      const res = await MB.post('/orders', {
        items: cartData.items.map(i => ({ productId: i.productId, quantity: i.quantity, unit: i.unit })),
        shippingAddress: { name, phone, address, city: document.getElementById('co-city').value },
        paymentMethod: selectedPayment,
        transactionId: document.getElementById('co-txid').value || null,
        couponCode: document.getElementById('co-coupon').value || null,
        note: document.getElementById('co-note').value || '',
      });
      if (res.success) { await MB.del('/cart/clear'); MB.toast('Order placed successfully!', 'success'); setTimeout(() => window.location.href = '/account/orders', 1500); }
      else { MB.toast(res.message || 'Order failed', 'error'); }
    } catch (err) { MB.toast(err.message || 'Order failed', 'error'); }
  }
</script>`));

// LOGIN PAGE
fs.writeFileSync(path.join(pagesDir, 'login.html'), wrap('Login', 'লগইন', `
  <section class="section"><div class="container" style="max-width:440px;">
    <div class="card">
      <h2 class="text-center" style="margin-bottom:24px;" data-en="Login to Medicine Bazar" data-bn="মেডিসিন বাজারে লগইন করুন">Login to Medicine Bazar</h2>
      <div id="login-error" class="alert alert-error hidden"></div>
      <div class="form-group"><label data-en="Email" data-bn="ইমেইল">Email</label><input type="email" id="login-email" class="form-control" required></div>
      <div class="form-group"><label data-en="Password" data-bn="পাসওয়ার্ড">Password</label><input type="password" id="login-password" class="form-control" required></div>
      <button class="btn btn-primary btn-block btn-lg" onclick="doLogin()" data-en="Login" data-bn="লগইন">Login</button>
      <p style="text-align:center;margin-top:16px;font-size:14px;"><a href="/register" data-en="Don't have an account? Register" data-bn="অ্যাকাউন্ট নেই? নিবন্ধন করুন">Don't have an account? Register</a></p>
      <div style="text-align:center;margin-top:12px;"><a href="#" style="font-size:13px;color:var(--text-muted);">Forgot Password?</a></div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);text-align:center;font-size:13px;color:var(--text-muted);">
        <p>Future login options:</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
          <button class="btn btn-outline btn-sm" disabled>Google Login</button>
          <button class="btn btn-outline btn-sm" disabled>Facebook Login</button>
        </div>
      </div>
    </div>
  </div></section>`, `<script>
  MB.loadUser();
  if (MB.isLoggedIn()) window.location.href = '/account';
  async function doLogin() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    if (!email || !pass) { MB.toast('Email and password required', 'error'); return; }
    try {
      const res = await MB.login(email, pass);
      if (res.success) {
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get('redirect') || (MB.isStaff() ? '/admin' : '/account');
      } else {
        document.getElementById('login-error').textContent = res.message || 'Login failed';
        document.getElementById('login-error').classList.remove('hidden');
      }
    } catch (err) {
      document.getElementById('login-error').textContent = err.message || 'Login failed';
      document.getElementById('login-error').classList.remove('hidden');
    }
  }
  document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
</script>`));

// REGISTER PAGE
fs.writeFileSync(path.join(pagesDir, 'register.html'), wrap('Register', 'নিবন্ধন', `
  <section class="section"><div class="container" style="max-width:440px;">
    <div class="card">
      <h2 class="text-center" style="margin-bottom:24px;">Create Account</h2>
      <div id="reg-error" class="alert alert-error hidden"></div>
      <div class="form-group"><label>Full Name</label><input type="text" id="reg-name" class="form-control" required></div>
      <div class="form-group"><label>Email</label><input type="email" id="reg-email" class="form-control" required></div>
      <div class="form-group"><label>Phone</label><input type="tel" id="reg-phone" class="form-control"></div>
      <div class="form-group"><label>Password (min 8 characters)</label><input type="password" id="reg-password" class="form-control" required></div>
      <button class="btn btn-primary btn-block btn-lg" onclick="doRegister()">Register</button>
      <p style="text-align:center;margin-top:16px;font-size:14px;"><a href="/login">Already have an account? Login</a></p>
    </div>
  </div></section>`, `<script>
  MB.loadUser();
  if (MB.isLoggedIn()) window.location.href = '/account';
  async function doRegister() {
    const name = document.getElementById('reg-name').value, email = document.getElementById('reg-email').value, phone = document.getElementById('reg-phone').value, pass = document.getElementById('reg-password').value;
    if (!name || !email || !pass) { MB.toast('All fields required', 'error'); return; }
    if (pass.length < 8) { MB.toast('Password must be at least 8 characters', 'error'); return; }
    try {
      const res = await MB.register(name, email, pass, phone);
      if (res.success) { window.location.href = '/account'; }
      else { document.getElementById('reg-error').textContent = res.message; document.getElementById('reg-error').classList.remove('hidden'); }
    } catch (err) { document.getElementById('reg-error').textContent = err.message; document.getElementById('reg-error').classList.remove('hidden'); }
  }
</script>`));

// ACCOUNT PAGE
fs.writeFileSync(path.join(pagesDir, 'account.html'), wrap('My Account', 'আমার অ্যাকাউন্ট', `
  <section class="section"><div class="container">
    <h2 class="section-title">My Account</h2>
    <div class="tabs"><button class="tab active" onclick="showTab('profile')">Profile</button><button class="tab" onclick="showTab('orders')">Orders</button><button class="tab" onclick="showTab('prescriptions')">Prescriptions</button></div>
    <div id="tab-profile" class="tab-content active"><div class="card"><div id="profile-info"><div class="loading"><div class="spinner"></div></div></div></div></div>
    <div id="tab-orders" class="tab-content"><div id="orders-list"><div class="loading"><div class="spinner"></div></div></div></div>
    <div id="tab-prescriptions" class="tab-content"><div id="prescriptions-list"><div class="loading"><div class="spinner"></div></div></div></div>
  </div></section>`, `<script>
  MB.loadUser();
  if (!MB.isLoggedIn()) window.location.href = '/login?redirect=/account';
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', ['profile','orders','prescriptions'][i] === name));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await MB.get('/auth/me');
    if (user.success) {
      const u = user.data;
      document.getElementById('profile-info').innerHTML = '<p><strong>Name:</strong> ' + u.name + '</p><p><strong>Email:</strong> ' + u.email + '</p><p><strong>Phone:</strong> ' + (u.phone || 'Not set') + '</p><p><strong>Role:</strong> ' + u.role + '</p><p><strong>Joined:</strong> ' + MB.formatDate(u.createdAt) + '</p><div style="margin-top:16px;"><a href="#" class="btn btn-outline btn-sm" onclick="showTab(\\'change-password\\')">Change Password</a></div>';
    }
    const orders = await MB.get('/orders/my-orders');
    if (orders.success) {
      document.getElementById('orders-list').innerHTML = orders.data.length > 0 ? '<div class="table-wrap"><table><thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead><tbody>' + orders.data.map(o => '<tr><td>' + o.orderNumber + '</td><td>' + MB.formatDate(o.createdAt) + '</td><td>' + MB.formatPrice(o.total) + '</td><td>' + o.orderStatus + '</td><td>' + o.paymentStatus + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="empty-state"><p>No orders yet</p><a href="/shop" class="btn btn-primary">Start Shopping</a></div>';
    }
    const prescriptions = await MB.get('/prescriptions/my-prescriptions');
    if (prescriptions.success) {
      document.getElementById('prescriptions-list').innerHTML = prescriptions.data.length > 0 ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Patient</th><th>Doctor</th><th>Status</th></tr></thead><tbody>' + prescriptions.data.map(p => '<tr><td>' + MB.formatDate(p.createdAt) + '</td><td>' + (p.patientName || '-') + '</td><td>' + (p.doctorName || '-') + '</td><td>' + p.status + '</td></tr>').join('') + '</tbody></table></div>' : '<div class="empty-state"><p>No prescriptions uploaded</p><a href="/prescription-upload" class="btn btn-primary">Upload Prescription</a></div>';
    }
    const path = window.location.pathname;
    if (path.includes('/orders')) showTab('orders');
    if (path.includes('/prescriptions')) showTab('prescriptions');
  });
</script>`));

// PRESCRIPTION UPLOAD
fs.writeFileSync(path.join(pagesDir, 'prescription-upload.html'), wrap('Upload Prescription', 'প্রেসক্রিপশন আপলোড', `
  <section class="section"><div class="container" style="max-width:600px;">
    <div class="card">
      <h2 style="margin-bottom:8px;" data-en="Upload Your Prescription" data-bn="আপনার প্রেসক্রিপশন আপলোড করুন">Upload Your Prescription</h2>
      <p style="color:var(--text-secondary);margin-bottom:24px;" data-en="Upload your doctor's prescription and we'll prepare your medicines." data-bn="আপনার ডাক্তারের প্রেসক্রিপশন আপলোড করুন।">Upload your doctor's prescription and we'll prepare your medicines.</p>
      <div id="upload-result" class="hidden"></div>
      <div class="form-group"><label>Patient Name</label><input type="text" id="rx-patient" class="form-control"></div>
      <div class="form-group"><label>Doctor Name</label><input type="text" id="rx-doctor" class="form-control"></div>
      <div class="form-group"><label>Prescription Image/PDF</label><input type="file" id="rx-file" class="form-control" accept="image/*,.pdf"></div>
      <div class="form-group"><label>Note (optional)</label><textarea id="rx-note" class="form-control" rows="3"></textarea></div>
      <button class="btn btn-primary btn-block btn-lg" onclick="uploadRx()">Upload Prescription</button>
      <div class="alert alert-info" style="margin-top:16px;">Your prescription is kept private and secure. Only authorized pharmacists can view it.</div>
    </div>
  </div></section>`, `<script>
  async function uploadRx() {
    if (!MB.isLoggedIn()) { window.location.href = '/login?redirect=/prescription-upload'; return; }
    const file = document.getElementById('rx-file').files[0];
    if (!file) { MB.toast('Please select a file', 'error'); return; }
    const fd = new FormData();
    fd.append('prescription', file);
    fd.append('patientName', document.getElementById('rx-patient').value);
    fd.append('doctorName', document.getElementById('rx-doctor').value);
    fd.append('note', document.getElementById('rx-note').value);
    try {
      const res = await MB.upload('/prescriptions/upload', fd);
      if (res.success) {
        document.getElementById('upload-result').className = 'alert alert-success';
        document.getElementById('upload-result').textContent = 'Prescription uploaded successfully! We will review it shortly.';
      } else {
        document.getElementById('upload-result').className = 'alert alert-error';
        document.getElementById('upload-result').textContent = res.message || 'Upload failed';
      }
    } catch (err) { MB.toast('Upload failed', 'error'); }
  }
</script>`));

// LAB TESTS
fs.writeFileSync(path.join(pagesDir, 'lab-tests.html'), wrap('Lab Tests', 'ল্যাব টেস্ট', `
  <section class="section"><div class="container">
    <div class="section-header"><div>
      <h2 class="section-title" data-en="Lab Tests" data-bn="ল্যাব টেস্ট">Lab Tests</h2>
      <p class="section-subtitle" data-en="Book lab tests from home. Results delivered to your door." data-bn="ঘরে বসে ল্যাব টেস্ট বুক করুন। ফলাফল আপনার দরজায় পৌঁছে যাবে।">Book lab tests from home. Results delivered to your door.</p>
    </div></div>
    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
      <select id="filter-category" class="form-control" style="max-width:200px;"><option value="">All Categories</option></select>
      <span id="test-count" style="color:var(--text-muted);font-size:14px;align-self:center;"></span>
    </div>
    <div id="lab-tests-list"><div class="loading"><div class="spinner"></div></div></div>
  </div></section>
  <section class="section section-alt"><div class="container" style="text-align:center;max-width:600px;">
    <h3 data-en="How It Works" data-bn="কিভাবে কাজ করে" style="margin-bottom:24px;">How It Works</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div><div style="font-size:36px;margin-bottom:8px;">1&#65039;&#8419;</div><p style="font-size:14px;" data-en="Choose your test and book online" data-bn="টেস্ট বাছাই করুন এবং অনলাইন বুক করুন">Choose your test and book online</p></div>
      <div><div style="font-size:36px;margin-bottom:8px;">2&#65039;&#8419;</div><p style="font-size:14px;" data-en="Sample collected from your home" data-bn="আপনার বাড়ি থেকে স্যাম্পল সংগ্রহ">Sample collected from your home</p></div>
      <div><div style="font-size:36px;margin-bottom:8px;">3&#65039;&#8419;</div><p style="font-size:14px;" data-en="Get your report online" data-bn="অনলাইনে রিপোর্ট পান">Get your report online</p></div>
    </div>
  </div></section>`, `<script>
  let allTests = [];
  function renderTests(tests) {
    const list = document.getElementById('lab-tests-list');
    document.getElementById('test-count').textContent = tests.length + ' tests available';
    if (tests.length > 0) {
      list.innerHTML = '<div class="products-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">' + tests.map(t => '<div class="lab-test-card"><h3>' + t.name + '</h3>' + (t.nameBn ? '<p style="color:var(--text-secondary);font-size:14px;">' + t.nameBn + '</p>' : '') + '<div class="test-price">' + MB.formatPrice(t.price) + '</div><p style="font-size:13px;margin:8px 0;color:var(--text-secondary);line-height:1.5;">' + (t.description || '') + '</p><div class="test-details">' + (t.sampleType ? '<span>Sample: ' + t.sampleType + '</span>' : '') + (t.turnaroundTime ? ' &bull; <span>Report: ' + t.turnaroundTime + '</span>' : '') + '</div>' + (t.preparationRequired ? '<p style="font-size:12px;color:var(--offer-orange);margin-top:8px;">&#9888; ' + (t.preparation || 'Preparation required') + '</p>' : '') + '<button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="bookTest(\\'' + t.id + '\\')">' + MB.t('Book Now', 'এখনই বুক করুন') + '</button></div>').join('') + '</div>';
    } else { list.innerHTML = '<div class="empty-state"><h3>' + MB.t('No lab tests available', 'কোনো ল্যাব টেস্ট পাওয়া যায়নি') + '</h3></div>'; }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    const res = await MB.get('/lab-tests');
    if (res.success) {
      allTests = res.data;
      const cats = [...new Set(allTests.map(t => t.category).filter(Boolean))].sort();
      const sel = document.getElementById('filter-category');
      cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
      sel.addEventListener('change', () => { const v = sel.value; renderTests(v ? allTests.filter(t => t.category === v) : allTests); });
      renderTests(allTests);
    } else { document.getElementById('lab-tests-list').innerHTML = '<div class="empty-state"><h3>No lab tests available yet</h3></div>'; }
  });
  async function bookTest(id) {
    if (!MB.isLoggedIn()) { window.location.href = '/login?redirect=/lab-tests'; return; }
    const name = prompt(MB.t('Patient Name:', 'রোগীর নাম:'));
    const phone = prompt(MB.t('Phone Number:', 'ফোন নম্বর:'));
    if (!name || !phone) return;
    const res = await MB.post('/lab-tests/book', { labTestId: id, patientName: name, phone });
    if (res.success) MB.toast(MB.t('Lab test booked successfully!', 'ল্যাব টেস্ট বুক হয়েছে!'), 'success');
    else MB.toast(res.message || 'Booking failed', 'error');
  }
</script>`));

// PHARMACY REGISTRATION
fs.writeFileSync(path.join(pagesDir, 'pharmacy-registration.html'), wrap('Pharmacy Registration', 'ফার্মেসি নিবন্ধন', `
  <section class="section"><div class="container" style="max-width:600px;">
    <div class="card">
      <h2 style="margin-bottom:24px;">Register Your Pharmacy</h2>
      <div id="reg-result" class="hidden"></div>
      <div class="form-group"><label>Pharmacy Name *</label><input type="text" id="ph-name" class="form-control" required></div>
      <div class="form-group"><label>Owner Name *</label><input type="text" id="ph-owner" class="form-control" required></div>
      <div class="form-group"><label>Phone *</label><input type="tel" id="ph-phone" class="form-control" required></div>
      <div class="form-group"><label>Email</label><input type="email" id="ph-email" class="form-control"></div>
      <div class="form-group"><label>Address</label><textarea id="ph-address" class="form-control" rows="3"></textarea></div>
      <div class="form-group"><label>Drug License (image/PDF)</label><input type="file" id="ph-license" class="form-control" accept="image/*,.pdf"></div>
      <div class="form-group"><label>Note</label><textarea id="ph-note" class="form-control" rows="2"></textarea></div>
      <button class="btn btn-primary btn-block btn-lg" onclick="submitPharmacy()">Submit Application</button>
    </div>
  </div></section>`, `<script>
  async function submitPharmacy() {
    const fd = new FormData();
    fd.append('pharmacyName', document.getElementById('ph-name').value);
    fd.append('ownerName', document.getElementById('ph-owner').value);
    fd.append('phone', document.getElementById('ph-phone').value);
    fd.append('email', document.getElementById('ph-email').value);
    fd.append('address', document.getElementById('ph-address').value);
    fd.append('note', document.getElementById('ph-note').value);
    const file = document.getElementById('ph-license').files[0];
    if (file) fd.append('license', file);
    const res = await fetch('/api/v1/pharmacy/apply', { method: 'POST', body: fd });
    const data = await res.json();
    document.getElementById('reg-result').className = data.success ? 'alert alert-success' : 'alert alert-error';
    document.getElementById('reg-result').textContent = data.success ? 'Application submitted! We will review and contact you.' : (data.message || 'Submission failed');
  }
</script>`));

// BLOG
fs.writeFileSync(path.join(pagesDir, 'blog.html'), wrap('Health Blog', 'স্বাস্থ্য ব্লগ', `
  <section class="section"><div class="container">
    <div class="section-header"><div>
      <h2 class="section-title" data-en="Health Blog" data-bn="স্বাস্থ্য ব্লগ">Health Blog</h2>
      <p class="section-subtitle" data-en="Health tips, medicine guides, and wellness articles" data-bn="স্বাস্থ্য পরামর্শ, ওষুধের গাইড এবং সুস্থতার নিবন্ধ">Health tips, medicine guides, and wellness articles</p>
    </div></div>
    <div id="blog-list"><div class="loading"><div class="spinner"></div></div></div>
  </div></section>`, `<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const res = await MB.get('/blogs');
    if (res.success && res.data.length > 0) {
      document.getElementById('blog-list').innerHTML = '<div class="products-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">' +
        res.data.map(b => '<div class="blog-card"><div class="blog-body">' +
          (b.category ? '<div class="blog-category">' + b.category + '</div>' : '') +
          '<h3><a href="/blog/' + b.slug + '">' + b.title + '</a></h3>' +
          (b.titleBn ? '<p style="color:var(--text-secondary);font-size:14px;margin-bottom:4px;">' + b.titleBn + '</p>' : '') +
          '<p style="font-size:14px;color:var(--text-muted);margin:8px 0;line-height:1.5;">' + (b.excerpt || '') + '</p>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);border-top:1px solid var(--border);padding-top:8px;margin-top:8px;"><span>' + (b.author || 'Medicine Bazar') + '</span><span>' + MB.formatDate(b.publishedAt || b.createdAt) + '</span></div>' +
          (b.tags && b.tags.length > 0 ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">' + b.tags.slice(0, 3).map(t => '<span style="font-size:11px;background:var(--soft-sky);color:var(--trust-blue);padding:2px 8px;border-radius:12px;">' + t + '</span>').join('') + '</div>' : '') +
          '</div></div>').join('') + '</div>';
    } else { document.getElementById('blog-list').innerHTML = '<div class="empty-state"><h3>' + MB.t('No blog posts yet', 'এখনো কোনো ব্লগ পোস্ট নেই') + '</h3></div>'; }
  });
</script>`));

// BLOG DETAIL
fs.writeFileSync(path.join(pagesDir, 'blog-detail.html'), wrap('Blog Post', 'ব্লগ পোস্ট', `
  <section class="section"><div class="container" style="max-width:800px;">
    <div id="blog-content"><div class="loading"><div class="spinner"></div></div></div>
  </div></section>`, `<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = window.location.pathname.split('/').pop();
    const res = await MB.get('/blogs/' + slug);
    if (res.success) {
      const b = res.data;
      document.title = b.title + ' - Medicine Bazar';
      document.getElementById('blog-content').innerHTML = '<a href="/blog" style="font-size:14px;">&larr; Back to Blog</a><h1 style="margin:16px 0 8px;">' + b.title + '</h1>' + (b.titleBn ? '<h2 style="font-size:18px;color:var(--text-secondary);margin-bottom:12px;">' + b.titleBn + '</h2>' : '') + '<p style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">By ' + (b.author || 'Medicine Bazar') + ' | ' + MB.formatDate(b.publishedAt || b.createdAt) + '</p><div class="card" style="line-height:1.8;">' + (b.content || '') + '</div>';
    } else { document.getElementById('blog-content').innerHTML = '<div class="empty-state"><h3>Blog post not found</h3><a href="/blog" class="btn btn-primary">Back to Blog</a></div>'; }
  });
</script>`));

// STATIC PAGES
const staticPages = {
  'about.html': { title: 'About Us', content: '<h1>About Medicine Bazar</h1><h2 style="color:var(--text-secondary);">মেডিসিন বাজার সম্পর্কে</h2><div class="card" style="margin-top:24px;line-height:1.8;"><p>Medicine Bazar is your trusted pharmacy partner. We provide genuine medicines at affordable prices with convenient home delivery.</p><p style="margin-top:12px;">আমরা সাশ্রয়ী মূল্যে আসল ওষুধ এবং সুবিধাজনক হোম ডেলিভারি প্রদান করি।</p><h3 style="margin-top:20px;">Our Services</h3><ul style="margin:12px 0 12px 20px;"><li>Online Medicine Ordering</li><li>Prescription Upload & Review</li><li>Lab Test Booking</li><li>Home Delivery</li><li>Pharmacy POS System</li></ul><h3>Contact</h3><p>Phone: 01602444532</p><p>WhatsApp: 01602444532</p><p>Facebook: <a href="https://facebook.com/medicinebazar24">facebook.com/medicinebazar24</a></p></div>' },
  'contact.html': { title: 'Contact Us', content: '<h1>Contact Us</h1><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;"><div class="card"><h3>Get in Touch</h3><p style="margin:12px 0;">&#128222; Phone: 01602444532</p><p>&#128231; Email: support@medicinebazar.com</p><p><a href="https://wa.me/8801602444532">WhatsApp: 01602444532</a></p><p><a href="https://facebook.com/medicinebazar24">Facebook Page</a></p><p><a href="https://www.youtube.com/@MedicineBazar24">YouTube Channel</a></p></div><div class="card"><h3>Send a Message</h3><div class="form-group"><label>Name</label><input type="text" id="ct-name" class="form-control"></div><div class="form-group"><label>Email</label><input type="email" id="ct-email" class="form-control"></div><div class="form-group"><label>Phone</label><input type="tel" id="ct-phone" class="form-control"></div><div class="form-group"><label>Message</label><textarea id="ct-msg" class="form-control" rows="4"></textarea></div><button class="btn btn-primary btn-block" onclick="sendContact()">Send Message</button></div></div>' },
  'privacy.html': { title: 'Privacy Policy', content: '<h1>Privacy Policy</h1><h2 style="color:var(--text-secondary);">গোপনীয়তা নীতি</h2><div class="card" style="margin-top:24px;line-height:1.8;"><h3>Data Collection</h3><p>We collect personal information (name, email, phone, address) for order processing and delivery.</p><h3 style="margin-top:16px;">Prescription Privacy</h3><p>Prescription files are stored securely and accessible only by authorized pharmacists and the uploading customer. We do not share prescription data with third parties.</p><h3 style="margin-top:16px;">Data Protection</h3><p>We use industry-standard security measures to protect your data.</p><h3 style="margin-top:16px;">Cookie Policy</h3><p>We use essential cookies for session management and functionality.</p><h3 style="margin-top:16px;">Data Retention</h3><p>Your data is retained as long as your account is active. You may request data deletion by contacting us.</p><h3 style="margin-top:16px;">Contact</h3><p>For privacy concerns: support@medicinebazar.com</p></div>' },
  'terms.html': { title: 'Terms & Conditions', content: '<h1>Terms & Conditions</h1><h2 style="color:var(--text-secondary);">শর্তাবলী</h2><div class="card" style="margin-top:24px;line-height:1.8;"><p>By using Medicine Bazar, you agree to these terms.</p><h3 style="margin-top:16px;">Products</h3><p>All medicines sold are genuine and sourced from authorized distributors.</p><h3 style="margin-top:16px;">Prescription Medicines</h3><p>Prescription-required medicines will only be dispensed with a valid prescription reviewed by a licensed pharmacist.</p><h3 style="margin-top:16px;">Pricing</h3><p>Prices are subject to change. MRP is set by manufacturers.</p><h3 style="margin-top:16px;">Payment</h3><p>We accept Cash on Delivery, Nagad, bKash, Upay, and Merchant payments.</p><h3 style="margin-top:16px;">Medical Disclaimer</h3><p>Medicine Bazar is not a medical practitioner. Always consult your doctor before taking any medicine.</p></div>' },
  'return.html': { title: 'Return Policy', content: '<h1>Return Policy</h1><h2 style="color:var(--text-secondary);">রিটার্ন নীতি</h2><div class="card" style="margin-top:24px;line-height:1.8;"><h3>Returns</h3><p>We accept returns within 7 days of delivery for damaged or wrong products.</p><h3 style="margin-top:16px;">Non-Returnable Items</h3><ul style="margin:8px 0 8px 20px;"><li>Opened medicine packs</li><li>Refrigerated medicines</li><li>Prescription medicines</li><li>Medical devices after use</li></ul><h3 style="margin-top:16px;">Refund Process</h3><p>Approved refunds will be processed within 7 business days via the original payment method.</p></div>' },
  'faq.html': { title: 'FAQ', content: '<h1>Frequently Asked Questions</h1><h2 style="color:var(--text-secondary);">সচরাচর জিজ্ঞাসা</h2><div style="margin-top:24px;">' +
    [['How do I order medicines?','Browse our shop, add medicines to cart, proceed to checkout, and select your payment method.'],
     ['Do I need a prescription?','Some medicines require a prescription. These are marked with "Rx" badge.'],
     ['What payment methods do you accept?','We accept Cash on Delivery, Nagad, bKash, Upay, and Merchant payments.'],
     ['How long does delivery take?','Usually 1-3 business days depending on your location.'],
     ['Can I return medicines?','Yes, within 7 days for damaged or wrong products. See our Return Policy.'],
     ['How do I upload a prescription?','Go to "Upload Prescription" page, fill in the details, and upload the image/PDF.'],
     ['Is my prescription data secure?','Yes, prescription files are stored securely and only accessible by authorized pharmacists.'],
    ].map(([q,a]) => '<div class="card" style="margin-bottom:12px;"><h3 style="font-size:16px;margin-bottom:8px;">' + q + '</h3><p style="color:var(--text-secondary);font-size:14px;">' + a + '</p></div>').join('') + '</div>' },
  '404.html': { title: 'Page Not Found', content: '<div class="empty-state" style="padding:80px 20px;"><div class="icon">&#128533;</div><h1 style="font-size:48px;color:var(--text-muted);">404</h1><h3>Page Not Found</h3><p style="margin-bottom:24px;">The page you are looking for does not exist.</p><a href="/" class="btn btn-primary">Go Home</a></div>' },
};

for (const [filename, { title, content }] of Object.entries(staticPages)) {
  const extraScript = filename === 'contact.html' ? `<script>
    async function sendContact() {
      const res = await MB.post('/contact', { name: document.getElementById('ct-name').value, email: document.getElementById('ct-email').value, phone: document.getElementById('ct-phone').value, message: document.getElementById('ct-msg').value });
      MB.toast(res.success ? 'Message sent!' : 'Failed to send', res.success ? 'success' : 'error');
    }
  </script>` : '';
  fs.writeFileSync(path.join(pagesDir, filename), wrap(title, '', `<section class="section"><div class="container" style="max-width:800px;">${content}</div></section>`, extraScript));
}

console.log('All pages generated!');
console.log('Files:', fs.readdirSync(pagesDir).join(', '));
