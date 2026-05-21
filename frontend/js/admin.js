/* Admin Panel JS */
const ADMIN_ROLE_SECTIONS = {
  admin: ['dashboard', 'orders', 'pos', 'products', 'import', 'categories', 'brands', 'media', 'banners', 'prescriptions', 'payments', 'lab-tests', 'pharmacy-apps', 'coupons', 'campaigns', 'blogs', 'reports-sales', 'reports-stock', 'reports-expiry', 'reports-refunds', 'reports-search', 'analytics', 'users', 'settings', 'audit-logs'],
  cashier: ['pos'],
  pharmacist: ['prescriptions'],
};

function sectionFromAdminPath() {
  const page = window.location.pathname.split('/').pop().replace('.html', '');
  if (page === 'pos') return 'pos';
  if (['prescription', 'prescriptions', 'prescription-queue'].includes(page)) return 'prescriptions';
  if (!page || page === 'admin' || page === 'index' || page === 'dashboard') return 'dashboard';
  return page;
}

function canAccessAdminSection(section) {
  return (ADMIN_ROLE_SECTIONS[MB.user?.role] || []).includes(section);
}

function showAdminForbidden(section) {
  document.body.innerHTML = `
    <section class="section">
      <div class="container" style="max-width:560px;">
        <div class="card text-center">
          <h1>403</h1>
          <h2>Access denied</h2>
          <p>You do not have permission to open this admin page.</p>
          <p style="color:var(--text-muted);font-size:14px;">Requested section: ${section}</p>
          <a class="btn btn-primary" href="/">Go home</a>
        </div>
      </div>
    </section>`;
}

function applyAdminRoleUI() {
  const allowed = ADMIN_ROLE_SECTIONS[MB.user?.role] || [];
  document.querySelectorAll('.admin-nav a[href^="#"]').forEach((link) => {
    const section = link.getAttribute('href').slice(1);
    const visible = allowed.includes(section);
    link.style.display = visible ? '' : 'none';
  });
  document.querySelectorAll('.admin-nav-section').forEach((sectionLabel) => {
    let next = sectionLabel.nextElementSibling;
    let hasVisibleLink = false;
    while (next && !next.classList.contains('admin-nav-section')) {
      if (next.matches?.('a[href^="#"]') && next.style.display !== 'none') hasVisibleLink = true;
      next = next.nextElementSibling;
    }
    sectionLabel.style.display = hasVisibleLink ? '' : 'none';
  });
}

(async function() {
  MB.loadUser();
  if (!MB.token) {
    window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }

  try {
    const res = await MB.get('/auth/me');
    MB.user = res.data;
    localStorage.setItem('mb_user', JSON.stringify(MB.user));
  } catch {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
    window.location.href = '/login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
    return;
  }

  const userInfo = document.getElementById('admin-user-info');
  if (userInfo) {
    userInfo.innerHTML = `<div class="name">${MB.user.name}</div><div class="role">${MB.user.role}</div>`;
  }

  applyAdminRoleUI();
  const initialSection = window.location.hash.substring(1) || sectionFromAdminPath();
  if (!canAccessAdminSection(initialSection)) {
    showAdminForbidden(initialSection);
    return;
  }
  loadSection(initialSection);
})();

async function loadSection(section) {
  if (!canAccessAdminSection(section)) {
    showAdminForbidden(section);
    return;
  }
  const content = document.getElementById('admin-content');
  const title = document.getElementById('admin-page-title');
  document.querySelectorAll('.admin-nav a').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.admin-nav a[href="#${section}"]`);
  if (activeLink) activeLink.classList.add('active');
  window.location.hash = section;

  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    switch (section) {
      case 'dashboard': title.textContent = 'Dashboard'; await loadDashboard(content); break;
      case 'products': title.textContent = 'Products'; await loadProducts(content); break;
      case 'import': title.textContent = 'Product Import'; loadImport(content); break;
      case 'categories': title.textContent = 'Categories'; await loadCategories(content); break;
      case 'brands': title.textContent = 'Brands'; await loadBrands(content); break;
      case 'orders': title.textContent = 'Orders'; await loadOrders(content); break;
      case 'prescriptions': title.textContent = 'Prescriptions'; await loadPrescriptions(content); break;
      case 'payments': title.textContent = 'Payment Verification'; await loadPayments(content); break;
      case 'users': title.textContent = 'Users'; await loadUsers(content); break;
      case 'settings': title.textContent = 'Settings'; await loadSettings(content); break;
      case 'audit-logs': title.textContent = 'Audit Logs'; await loadAuditLogs(content); break;
      case 'media': title.textContent = 'Media Manager'; await loadMedia(content); break;
      case 'banners': title.textContent = 'Banners'; await loadBanners(content); break;
      case 'coupons': title.textContent = 'Coupons'; await loadCoupons(content); break;
      case 'campaigns': title.textContent = 'Campaigns'; await loadCampaigns(content); break;
      case 'blogs': title.textContent = 'Blog Posts'; await loadBlogs(content); break;
      case 'lab-tests': title.textContent = 'Lab Tests'; await loadLabTests(content); break;
      case 'pharmacy-apps': title.textContent = 'Pharmacy Applications'; await loadPharmacyApps(content); break;
      case 'pos': title.textContent = 'Point of Sale'; await loadPOS(content); break;
      case 'reports-sales': title.textContent = 'Sales Report'; await loadSalesReport(content); break;
      case 'reports-stock': title.textContent = 'Stock Report'; await loadStockReport(content); break;
      case 'reports-expiry': title.textContent = 'Expiry Report'; await loadExpiryReport(content); break;
      case 'reports-refunds': title.textContent = 'Refunds'; await loadRefundsReport(content); break;
      case 'reports-search': title.textContent = 'Failed Searches'; await loadSearchReport(content); break;
      case 'analytics': title.textContent = 'Analytics'; await loadAnalytics(content); break;
      default: title.textContent = section; content.innerHTML = '<div class="empty-state"><h3>Section not found</h3></div>';
    }
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">Error loading section: ${err.message || 'Unknown error'}</div>`;
  }
}

async function loadDashboard(el) {
  const res = await MB.get('/admin/dashboard');
  if (!res.success) { el.innerHTML = '<div class="alert alert-error">Failed to load dashboard</div>'; return; }
  const d = res.data;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Today Sales</div><div class="value">${MB.formatPrice(d.todaySales)}</div></div>
      <div class="stat-card blue"><div class="label">Monthly Sales</div><div class="value">${MB.formatPrice(d.monthlySales)}</div></div>
      <div class="stat-card teal"><div class="label">Total Products</div><div class="value">${d.totalProducts}</div><div class="sub">Active: ${d.activeProducts}</div></div>
      <div class="stat-card"><div class="label">Stocked Products</div><div class="value">${d.stockedProducts}</div></div>
      <div class="stat-card orange"><div class="label">Pending Orders</div><div class="value">${d.pendingOrders}</div></div>
      <div class="stat-card red"><div class="label">Pending Prescriptions</div><div class="value">${d.pendingPrescriptions}</div></div>
      <div class="stat-card orange"><div class="label">Pending Payments</div><div class="value">${d.pendingPaymentVerification}</div></div>
      <div class="stat-card red"><div class="label">Low Stock Items</div><div class="value">${d.lowStockCount}</div></div>
      <div class="stat-card"><div class="label">Total Customers</div><div class="value">${d.totalCustomers}</div></div>
      <div class="stat-card blue"><div class="label">Online Orders</div><div class="value">${d.totalOnlineOrders}</div><div class="sub">${MB.formatPrice(d.onlineSalesTotal)}</div></div>
      <div class="stat-card teal"><div class="label">POS Sales</div><div class="value">${d.totalPosSales}</div><div class="sub">${MB.formatPrice(d.posSalesTotal)}</div></div>
      <div class="stat-card red"><div class="label">Refunds</div><div class="value">${d.totalRefunds}</div><div class="sub">${MB.formatPrice(d.refundTotal)}</div></div>
    </div>
    <div class="chart-grid">
      <div class="chart-card"><h3>Sales Overview</h3><div class="metric-bars">
        <div><span>Online</span><strong>${MB.formatPrice(d.onlineSalesTotal)}</strong><i style="width:${Math.min(100, d.onlineSalesTotal / Math.max(d.onlineSalesTotal + d.posSalesTotal, 1) * 100)}%"></i></div>
        <div><span>POS</span><strong>${MB.formatPrice(d.posSalesTotal)}</strong><i style="width:${Math.min(100, d.posSalesTotal / Math.max(d.onlineSalesTotal + d.posSalesTotal, 1) * 100)}%"></i></div>
      </div></div>
      <div class="chart-card"><h3>Stock Status</h3><div class="metric-bars stock">
        <div><span>Sold</span><strong>${d.soldPercentage}%</strong><i style="width:${d.soldPercentage}%"></i></div>
        <div><span>Remaining</span><strong>${d.remainingStockPercentage}%</strong><i style="width:${d.remainingStockPercentage}%"></i></div>
      </div></div>
    </div>
    <div class="chart-grid">
      <div class="chart-card"><h3>Pending Tasks</h3><div class="task-list">
        <button class="task-row" onclick="loadSection('orders')"><span>Pending Orders</span><strong>${d.pendingOrders}</strong></button>
        <button class="task-row" onclick="loadSection('prescriptions')"><span>Pending Prescriptions</span><strong>${d.pendingPrescriptions}</strong></button>
        <button class="task-row" onclick="loadSection('payments')"><span>Manual Payments</span><strong>${d.pendingPaymentVerification}</strong></button>
        <button class="task-row" onclick="loadSection('reports-refunds')"><span>Refund Queue</span><strong>${d.totalRefunds}</strong></button>
      </div></div>
      <div class="chart-card"><h3>Quick Actions</h3><div class="quick-actions">
        <button class="btn btn-primary" onclick="loadSection('pos')">Open POS</button>
        <button class="btn btn-outline" onclick="loadSection('import')">Import Products</button>
        <button class="btn btn-outline" onclick="loadSection('payments')">Verify Payments</button>
        <button class="btn btn-outline" onclick="loadSection('reports-stock')">Stock Report</button>
      </div></div>
    </div>
    ${d.lowStockItems && d.lowStockItems.length > 0 ? '<div class="card"><h3 style="margin-bottom:12px;">Low Stock Items</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th></tr></thead><tbody>' + d.lowStockItems.map(p => `<tr><td>${p.name}</td><td style="color:var(--alert-red);font-weight:700;">${p.stock}</td></tr>`).join('') + '</tbody></table></div></div>' : ''}`;

  // Update sidebar badges
  const pendingOrdersBadge = document.getElementById('pending-orders-count');
  if (pendingOrdersBadge && d.pendingOrders > 0) { pendingOrdersBadge.textContent = d.pendingOrders; pendingOrdersBadge.style.display = 'inline'; }
  const pendingRxBadge = document.getElementById('pending-rx-count');
  if (pendingRxBadge && d.pendingPrescriptions > 0) { pendingRxBadge.textContent = d.pendingPrescriptions; pendingRxBadge.style.display = 'inline'; }
}

async function loadProducts(el) {
  const filters = await MB.get('/search/filters').catch(() => ({ data: {} }));
  const f = filters.data || {};
  el.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;">
        <input id="product-search-filter" class="form-control" placeholder="Search products">
        <select id="product-manufacturer-filter" class="form-control"><option value="">All manufacturers</option>${(f.manufacturers || []).map(x => `<option value="${x}">${x}</option>`).join('')}</select>
        <select id="product-generic-filter" class="form-control"><option value="">All generics</option>${(f.generics || []).slice(0, 500).map(x => `<option value="${x}">${x}</option>`).join('')}</select>
        <select id="product-form-filter" class="form-control"><option value="">All dosage forms</option>${(f.dosageForms || []).map(x => `<option value="${x}">${x}</option>`).join('')}</select>
        <select id="product-class-filter" class="form-control"><option value="">All drug classes</option>${(f.drugClasses || []).map(x => `<option value="${x}">${x}</option>`).join('')}</select>
        <select id="product-indication-filter" class="form-control"><option value="">All indications</option>${(f.indications || []).slice(0, 500).map(x => `<option value="${x}">${x}</option>`).join('')}</select>
        <select id="product-rx-filter" class="form-control"><option value="">Rx: all</option><option value="true">Prescription required</option><option value="false">No prescription</option></select>
        <select id="product-stock-filter" class="form-control"><option value="">Stock: all</option><option value="in_stock">In stock</option><option value="out_of_stock">Out of stock</option></select>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="loadProductTable()">Apply Filters</button>
    </div>
    <div id="product-table"></div>`;
  await loadProductTable();
}

async function loadProductTable() {
  const el = document.getElementById('product-table') || document.getElementById('admin-content');
  const params = new URLSearchParams({ limit: '50' });
  const filterMap = [
    ['product-search-filter', 'search'],
    ['product-manufacturer-filter', 'manufacturer'],
    ['product-generic-filter', 'generic'],
    ['product-form-filter', 'dosageForm'],
    ['product-class-filter', 'drugClass'],
    ['product-indication-filter', 'indication'],
    ['product-rx-filter', 'prescriptionRequired'],
    ['product-stock-filter', 'stockStatus'],
  ];
  filterMap.forEach(([id, key]) => {
    const value = document.getElementById(id)?.value;
    if (value) params.set(key, value);
  });
  const res = await MB.get('/products?' + params.toString());
  if (!res.success) { el.innerHTML = '<div class="alert alert-error">Failed to load products</div>'; return; }
  el.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span>${res.pagination.total} total products</span></div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Generic</th><th>Manufacturer</th><th>Form</th><th>Drug Class</th><th>Indication</th><th>Price</th><th>Stock</th><th>Rx</th><th>Status</th></tr></thead><tbody>
    ${res.data.map(p => `<tr><td><strong>${p.name}</strong> ${p.strength || ''}<br><small style="color:var(--text-muted);">${p.nameBn || p.source || ''}</small></td><td>${p.genericName || ''}</td><td>${p.manufacturer || ''}</td><td>${p.dosageForm || ''}</td><td>${p.drugClass || ''}</td><td>${p.indication || (p.indications || []).slice(0, 2).join(', ')}</td><td>${p.sellingPrice || p.mrp ? MB.formatPrice(p.sellingPrice || p.mrp) : 'Not set'}</td><td>${p.stockQuantity || 0}</td><td>${p.prescriptionRequired ? 'Yes' : 'No'}</td><td>${p.active !== false ? '<span style="color:var(--primary);">Active</span>' : '<span style="color:var(--alert-red);">Inactive</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function loadImport(el) {
  el.innerHTML = `
    <div id="import-stats"></div>
    <div class="card" style="max-width:860px;">
      <h3 style="margin-bottom:16px;">Import Products</h3>
      <p style="margin-bottom:12px;color:var(--text-secondary);">Upload Medicine Bazar CSV or bd-medicine-scraper/Kaggle-compatible CSV files. Use only data you are licensed to import.</p>
      <div class="alert alert-info">Dataset files supported: medicine.csv, manufacturer.csv, generic.csv, indication.csv, drug_class.csv, dosage_form.csv. Medical text is stored as reference content, not advice.</div>
      <div class="form-group"><label>Import Mode</label><select id="import-mode" class="form-control"><option value="bd-medicine-dataset">bd-medicine-scraper/Kaggle dataset</option><option value="legacy-product-csv">Medicine Bazar product CSV</option></select></div>
      <div class="form-group"><label>Select CSV/TXT File(s)</label><input type="file" id="import-file" class="form-control" accept=".csv,.txt" multiple></div>
      <button class="btn btn-primary" onclick="previewImport()">Preview Import</button>
    </div>
    <div id="import-preview" style="margin-top:20px;"></div>
    <div id="import-history" style="margin-top:20px;"></div>`;
  loadImportStats();
  loadImportHistory();
}

async function previewImport() {
  const files = Array.from(document.getElementById('import-file').files || []);
  if (files.length === 0) { MB.toast('Select a file', 'error'); return; }
  const fd = new FormData();
  files.forEach(file => fd.append('files', file));
  fd.append('mode', document.getElementById('import-mode').value);
  const res = await MB.upload('/admin/import/upload', fd);
  if (!res.success) { MB.toast(res.message || 'Upload failed', 'error'); return; }
  const d = res.data;
  const importFiles = encodeURIComponent(JSON.stringify(d.importFiles || (d.importId ? [{ importId: d.importId, sourceName: d.sourceName }] : [])));
  document.getElementById('import-preview').innerHTML = `
    <div class="card">
      <h3>Import Preview</h3>
      <div class="stats-grid" style="margin:16px 0;">
        <div class="stat-card"><div class="label">Total Rows</div><div class="value">${d.totalRows}</div></div>
        <div class="stat-card"><div class="label">Valid</div><div class="value">${d.validRows}</div></div>
        <div class="stat-card red"><div class="label">Invalid</div><div class="value">${d.invalidRows}</div></div>
        <div class="stat-card orange"><div class="label">Duplicates</div><div class="value">${d.duplicates}</div></div>
        <div class="stat-card teal"><div class="label">New Products</div><div class="value">${d.newProducts}</div></div>
        <div class="stat-card blue"><div class="label">Updates</div><div class="value">${d.updateProducts || 0}</div></div>
      </div>
      ${d.entityCounts ? `<div class="stats-grid" style="margin:16px 0;">
        <div class="stat-card"><div class="label">Manufacturers</div><div class="value">${d.entityCounts.manufacturers || 0}</div></div>
        <div class="stat-card"><div class="label">Generics</div><div class="value">${d.entityCounts.generics || 0}</div></div>
        <div class="stat-card"><div class="label">Dosage Forms</div><div class="value">${d.entityCounts.dosageForms || 0}</div></div>
        <div class="stat-card"><div class="label">Drug Classes</div><div class="value">${d.entityCounts.drugClasses || 0}</div></div>
        <div class="stat-card"><div class="label">Indications</div><div class="value">${d.entityCounts.indications || 0}</div></div>
      </div>` : ''}
      <div class="alert alert-info">${d.formatNote || ''}</div>
      ${(d.newProducts > 0 || d.updateProducts > 0 || d.entityCounts) ? `<button class="btn btn-primary btn-lg" onclick="commitImport('${d.importId || ''}', '${d.mode || 'legacy-product-csv'}', '${importFiles}')" >Commit Import</button>` : '<div class="alert alert-warning">No new products to import</div>'}
      ${d.preview && d.preview.length ? '<h4 style="margin-top:16px;">Preview:</h4><div class="table-wrap"><table><thead><tr><th>Name</th><th>Generic</th><th>Manufacturer</th><th>Price</th><th>Stock</th><th>Source</th></tr></thead><tbody>' + d.preview.map(p => `<tr><td>${p.name} ${p.strength || ''}</td><td>${p.genericName || ''}</td><td>${p.manufacturer || ''}</td><td>${p.sellingPrice || p.mrp ? MB.formatPrice(p.sellingPrice || p.mrp) : 'Not set'}</td><td>${p.stockQuantity || 0}</td><td>${p.source || p.importedSource || ''}</td></tr>`).join('') + '</tbody></table></div>' : ''}
      ${d.invalidRows > 0 ? '<h4 style="margin-top:16px;">Invalid Rows:</h4><div class="table-wrap"><table><thead><tr><th>Row</th><th>Error</th></tr></thead><tbody>' + d.invalidDetails.map(r => `<tr><td>${r.file || ''} #${r.row}</td><td>${r.error}</td></tr>`).join('') + '</tbody></table></div>' : ''}
      ${d.duplicates > 0 ? '<h4 style="margin-top:16px;">Duplicate Rows:</h4><div class="table-wrap"><table><thead><tr><th>Row</th><th>Action</th><th>Reason</th></tr></thead><tbody>' + d.duplicateDetails.map(r => `<tr><td>${r.file || ''} #${r.row || '-'}</td><td>${r.action || 'duplicate'}</td><td>${r.reason || r.name || ''}</td></tr>`).join('') + '</tbody></table></div>' : ''}
    </div>`;
}

async function commitImport(importId, mode = 'legacy-product-csv', encodedFiles = '') {
  const importFiles = encodedFiles ? JSON.parse(decodeURIComponent(encodedFiles)) : null;
  const res = await MB.post('/admin/import/commit', { importId, mode, importFiles });
  if (res.success) { MB.toast(`${res.data.count} products imported, ${res.data.updatedCount || 0} updated`, 'success'); loadSection('import'); }
  else MB.toast(res.message || 'Import failed', 'error');
}

async function loadImportStats() {
  const el = document.getElementById('import-stats');
  if (!el) return;
  const res = await MB.get('/admin/import/stats').catch(() => null);
  if (!res?.success) return;
  const d = res.data;
  el.innerHTML = `<div class="stats-grid" style="margin-bottom:16px;">
    <div class="stat-card teal"><div class="label">Imported Medicines</div><div class="value">${d.importedMedicines}</div><div class="sub">${d.source}</div></div>
    <div class="stat-card"><div class="label">Manufacturers</div><div class="value">${d.manufacturers}</div></div>
    <div class="stat-card"><div class="label">Generics</div><div class="value">${d.generics}</div></div>
    <div class="stat-card"><div class="label">Dosage Forms</div><div class="value">${d.dosageForms}</div></div>
    <div class="stat-card"><div class="label">Drug Classes</div><div class="value">${d.drugClasses}</div></div>
    <div class="stat-card"><div class="label">Indications</div><div class="value">${d.indications}</div></div>
  </div>`;
}

async function loadImportHistory() {
  const el = document.getElementById('import-history');
  if (!el) return;
  const res = await MB.get('/admin/import/history').catch(() => null);
  if (!res?.success) return;
  el.innerHTML = `<div class="card"><h3 style="margin-bottom:12px;">Import History</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Source</th><th>Products</th><th>Updated</th><th>Failed</th><th>Duplicates</th><th>By</th><th>Rollback</th></tr></thead><tbody>
    ${(res.data || []).slice(0, 20).map(h => `<tr><td>${MB.formatDate(h.createdAt)}</td><td>${h.source || h.mode || '-'}</td><td>${h.count || 0}</td><td>${h.updatedCount || 0}</td><td>${h.failedRows || 0}</td><td>${h.duplicates || 0}</td><td>${h.importedBy || '-'}</td><td>${h.rollbackSafe && !h.rolledBack ? `<button class="btn btn-danger btn-sm" onclick="rollbackImport('${h.id}')">Rollback</button>` : (h.rolledBack ? 'Rolled back' : '-')}</td></tr>`).join('') || '<tr><td colspan="8">No import history</td></tr>'}
  </tbody></table></div></div>`;
}

async function rollbackImport(id) {
  if (!confirm('Rollback this import? Imported products will be removed and updated products restored.')) return;
  const res = await MB.post(`/admin/import/${id}/rollback`, {});
  if (res.success) { MB.toast('Import rolled back', 'success'); loadSection('import'); }
  else MB.toast(res.message || 'Rollback failed', 'error');
}

async function loadCategories(el) {
  const res = await MB.get('/admin/categories');
  el.innerHTML = `<button class="btn btn-primary" style="margin-bottom:16px;" onclick="promptAddCategory()">+ Add Category</button>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Bangla</th><th>Slug</th><th>Status</th></tr></thead><tbody>
    ${(res.data || []).map(c => `<tr><td>${c.name}</td><td>${c.nameBn || ''}</td><td>${c.slug}</td><td>${c.active !== false ? 'Active' : 'Inactive'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function promptAddCategory() {
  const name = prompt('Category name:');
  if (!name) return;
  const nameBn = prompt('Category name (Bangla):') || '';
  await MB.post('/admin/categories', { name, nameBn });
  MB.toast('Category added', 'success');
  loadSection('categories');
}

async function loadBrands(el) {
  const res = await MB.get('/admin/brands');
  el.innerHTML = `<button class="btn btn-primary" style="margin-bottom:16px;" onclick="promptAddBrand()">+ Add Brand</button>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Slug</th><th>Country</th><th>Status</th></tr></thead><tbody>
    ${(res.data || []).map(b => `<tr><td>${b.name}</td><td>${b.slug}</td><td>${b.country || ''}</td><td>${b.active !== false ? 'Active' : 'Inactive'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function promptAddBrand() {
  const name = prompt('Brand name:');
  if (!name) return;
  await MB.post('/admin/brands', { name });
  MB.toast('Brand added', 'success');
  loadSection('brands');
}

async function loadOrders(el) {
  const res = await MB.get('/orders?limit=50');
  if (!res.success) return;
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th>Action</th></tr></thead><tbody>
    ${res.data.map(o => `<tr><td>${o.orderNumber}</td><td>${o.customerName || ''}</td><td>${MB.formatPrice(o.total)}</td><td>${o.orderStatus}</td><td>${o.paymentStatus}</td><td>${MB.formatDate(o.createdAt)}</td><td><select onchange="updateOrderStatus('${o.id}', this.value)" class="form-control" style="width:130px;"><option value="">Change</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function updateOrderStatus(id, status) {
  if (!status) return;
  await MB.put(`/orders/${id}/status`, { orderStatus: status });
  MB.toast('Order updated', 'success');
  loadSection('orders');
}

async function loadPrescriptions(el) {
  const res = await MB.get('/prescriptions/queue');
  if (!res.success) return;
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Action</th></tr></thead><tbody>
    ${res.data.map(p => `<tr><td>${MB.formatDate(p.createdAt)}</td><td>${p.customerName || ''}</td><td>${p.patientName || ''}</td><td>${p.doctorName || ''}</td><td>${p.status}</td><td><a href="/api/v1/prescriptions/download/${p.id}" target="_blank" class="btn btn-sm btn-outline">View</a> <select onchange="reviewPrescription('${p.id}', this.value)" class="form-control" style="width:120px;display:inline-block;"><option value="">Review</option><option value="approved">Approve</option><option value="rejected">Reject</option><option value="clarification">Need Info</option></select></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function reviewPrescription(id, status) {
  if (!status) return;
  const note = prompt('Note (optional):') || '';
  await MB.put(`/prescriptions/${id}/review`, { status, pharmacistNote: note });
  MB.toast('Prescription reviewed', 'success');
  loadSection('prescriptions');
}

async function loadPayments(el) {
  const res = await MB.get('/orders?paymentStatus=pending_verification&limit=50');
  if (!res.success) return;
  el.innerHTML = `<h3 style="margin-bottom:16px;">Pending Payment Verification</h3>
    <div class="table-wrap"><table><thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Method</th><th>TxID</th><th>Proof</th><th>Action</th></tr></thead><tbody>
    ${res.data.map(o => `<tr><td>${o.orderNumber}</td><td>${o.customerName || ''}</td><td>${MB.formatPrice(o.total)}</td><td>${o.paymentMethod}</td><td>${o.transactionId || '-'}</td><td>${o.paymentProofUrl ? '<a href="' + o.paymentProofUrl + '" target="_blank">View</a>' : '-'}</td><td><button class="btn btn-sm btn-primary" onclick="verifyPayment('${o.id}','verified')">Verify</button> <button class="btn btn-sm btn-danger" onclick="verifyPayment('${o.id}','rejected')">Reject</button></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function verifyPayment(id, status) {
  await MB.put(`/orders/${id}/verify-payment`, { paymentStatus: status });
  MB.toast(`Payment ${status}`, 'success');
  loadSection('payments');
}

async function loadUsers(el) {
  const res = await MB.get('/admin/users');
  if (!res.success) return;
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>
    ${res.data.map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td>${u.active ? 'Active' : 'Inactive'}</td><td>${MB.formatDate(u.createdAt)}</td><td><select onchange="changeRole('${u.id}', this.value)" class="form-control" style="width:120px;"><option value="">Role</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="pharmacist">Pharmacist</option><option value="cashier">Cashier</option><option value="customer">Customer</option></select></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function changeRole(id, role) {
  if (!role) return;
  await MB.put(`/admin/users/${id}/role`, { role });
  MB.toast('Role updated', 'success');
  loadSection('users');
}

async function loadSettings(el) {
  const res = await MB.get('/admin/settings');
  if (!res.success) return;
  const s = res.data;
  el.innerHTML = `
    <div class="card" style="max-width:600px;">
      <h3 style="margin-bottom:16px;">Site Settings & Branding</h3>
      <div class="form-group"><label>Site Name</label><input type="text" id="set-name" class="form-control" value="${s.siteName || ''}"></div>
      <div class="form-group"><label>Site Name (Bangla)</label><input type="text" id="set-nameBn" class="form-control" value="${s.siteNameBn || ''}"></div>
      <div class="form-group"><label>Tagline</label><input type="text" id="set-tagline" class="form-control" value="${s.tagline || ''}"></div>
      <div class="form-group"><label>Support Phone</label><input type="text" id="set-phone" class="form-control" value="${s.supportPhone || ''}"></div>
      <div class="form-group"><label>WhatsApp/IMO</label><input type="text" id="set-whatsapp" class="form-control" value="${s.whatsapp || ''}"></div>
      <div class="form-group"><label>Facebook</label><input type="text" id="set-fb" class="form-control" value="${s.facebook || ''}"></div>
      <div class="form-group"><label>YouTube</label><input type="text" id="set-yt" class="form-control" value="${s.youtube || ''}"></div>
      <div class="form-group"><label>WhatsApp Channel</label><input type="text" id="set-wac" class="form-control" value="${s.whatsappChannel || ''}"></div>
      <div class="form-group"><label>Footer Text</label><input type="text" id="set-footer" class="form-control" value="${s.footerText || ''}"></div>
      <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
      <hr style="margin:24px 0;">
      <h3>Logo Upload</h3>
      <div class="form-group"><label>Header Logo</label><input type="file" id="logo-header" class="form-control" accept="image/*"></div>
      <button class="btn btn-outline" onclick="uploadLogo('headerLogo', 'logo-header')">Upload Header Logo</button>
      <div class="form-group" style="margin-top:12px;"><label>Favicon</label><input type="file" id="logo-favicon" class="form-control" accept="image/*"></div>
      <button class="btn btn-outline" onclick="uploadLogo('favicon', 'logo-favicon')">Upload Favicon</button>
    </div>`;
}

async function saveSettings() {
  await MB.put('/admin/settings', {
    siteName: document.getElementById('set-name').value,
    siteNameBn: document.getElementById('set-nameBn').value,
    tagline: document.getElementById('set-tagline').value,
    supportPhone: document.getElementById('set-phone').value,
    whatsapp: document.getElementById('set-whatsapp').value,
    facebook: document.getElementById('set-fb').value,
    youtube: document.getElementById('set-yt').value,
    whatsappChannel: document.getElementById('set-wac').value,
    footerText: document.getElementById('set-footer').value,
  });
  MB.toast('Settings saved', 'success');
}

async function uploadLogo(type, inputId) {
  const file = document.getElementById(inputId).files[0];
  if (!file) { MB.toast('Select a file', 'error'); return; }
  const fd = new FormData(); fd.append('logo', file); fd.append('type', type);
  const res = await MB.upload('/admin/settings/logo', fd);
  if (res.success) MB.toast('Logo uploaded', 'success');
  else MB.toast('Upload failed', 'error');
}

async function loadAuditLogs(el) {
  const res = await MB.get('/admin/audit-logs?limit=100');
  if (!res.success) return;
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Time</th><th>Action</th><th>User</th><th>Role</th><th>IP</th></tr></thead><tbody>
    ${res.data.map(l => `<tr><td style="white-space:nowrap;">${MB.formatDate(l.timestamp || l.createdAt)}</td><td>${l.action}</td><td>${l.userEmail || '-'}</td><td>${l.userRole || '-'}</td><td>${l.ip || '-'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function loadMedia(el) {
  const res = await MB.get('/admin/media');
  el.innerHTML = `<div class="card" style="max-width:760px;">
      <h3 style="margin-bottom:12px;">Media Library</h3>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
        <div class="form-group"><label>Upload Image</label><input type="file" id="media-file" class="form-control" accept="image/png,image/jpeg,image/webp,image/gif"></div>
        <div class="form-group"><label>Alt Text</label><input type="text" id="media-alt" class="form-control" placeholder="Medicine image"></div>
        <div class="form-group"><label>Usage</label><select id="media-category" class="form-control"><option value="product">Product</option><option value="category">Category</option><option value="brand">Brand</option><option value="banner">Banner</option><option value="fallback">Fallback</option><option value="payment">Payment Proof</option></select></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="uploadMedia()">Upload</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:20px;">
    ${(res.data || []).map(m => `<div class="card" style="padding:8px;"><img src="${m.url}" style="width:100%;height:130px;object-fit:contain;border-radius:4px;background:var(--bg);"><p style="font-size:12px;margin-top:6px;word-break:break-all;"><strong>${m.altText || m.originalName || m.fileName}</strong></p><p style="font-size:11px;color:var(--text-muted);">${m.category || 'general'} ${m.usage ? ' | ' + m.usage : ''}</p><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;"><button class="btn btn-outline btn-sm" onclick="editMedia('${m.id}', '${(m.altText || '').replace(/'/g, "\\'")}', '${m.category || 'general'}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteMedia('${m.id}')">Delete</button></div></div>`).join('') || '<div class="empty-state"><h3>No media yet</h3><p>Upload product, category, brand, and banner images.</p></div>'}
    </div>`;
}

async function uploadMedia() {
  const file = document.getElementById('media-file').files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('altText', document.getElementById('media-alt')?.value || '');
  fd.append('category', document.getElementById('media-category')?.value || 'product');
  const res = await MB.upload('/admin/media', fd);
  if (res.success) { MB.toast('Uploaded', 'success'); loadSection('media'); }
}

async function editMedia(id, altText, category) {
  const nextAlt = prompt('Alt text:', altText) ?? altText;
  const nextCategory = prompt('Category:', category) ?? category;
  await MB.put(`/admin/media/${id}`, { altText: nextAlt, category: nextCategory });
  MB.toast('Media updated', 'success');
  loadSection('media');
}

async function deleteMedia(id) {
  if (!confirm('Delete this media file?')) return;
  await MB.del(`/admin/media/${id}`);
  MB.toast('Media deleted', 'success');
  loadSection('media');
}

async function loadBanners(el) {
  const res = await MB.get('/admin/banners');
  el.innerHTML = `<button class="btn btn-primary" style="margin-bottom:16px;" onclick="promptAddBanner()">+ Add Banner</button>
    <div class="table-wrap"><table><thead><tr><th>Title</th><th>Link</th><th>Image</th><th>Status</th></tr></thead><tbody>
    ${(res.data || []).map(b => `<tr><td><strong>${b.title || '-'}</strong><br><small>${b.titleBn || ''}</small></td><td>${b.link || '-'}</td><td>${b.imageUrl ? `<a href="${b.imageUrl}" target="_blank">View</a>` : '-'}</td><td>${b.active !== false ? 'Active' : 'Inactive'}</td></tr>`).join('') || '<tr><td colspan="4">No banners yet</td></tr>'}
    </tbody></table></div>`;
}

async function promptAddBanner() {
  const title = prompt('Banner title:');
  if (!title) return;
  const link = prompt('Link:', '/shop') || '/shop';
  await MB.post('/admin/banners', { title, link, active: true });
  MB.toast('Banner added', 'success');
  loadSection('banners');
}

async function loadCoupons(el) {
  const res = await MB.get('/admin/coupons');
  el.innerHTML = `<button class="btn btn-primary" style="margin-bottom:16px;" onclick="promptAddCoupon()">+ Add Coupon</button>
    <div class="table-wrap"><table><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Status</th></tr></thead><tbody>
    ${(res.data || []).map(c => `<tr><td><strong>${c.code}</strong></td><td>${c.type || 'fixed'}</td><td>${c.value}</td><td>${MB.formatPrice(c.minOrderAmount || 0)}</td><td>${c.usedCount || 0}/${c.usageLimit || '∞'}</td><td>${c.active ? 'Active' : 'Inactive'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function promptAddCoupon() {
  const code = prompt('Coupon code:');
  if (!code) return;
  const type = prompt('Type (percentage or fixed):') || 'fixed';
  const value = parseFloat(prompt('Value:') || '0');
  await MB.post('/admin/coupons', { code, type, value });
  MB.toast('Coupon added', 'success');
  loadSection('coupons');
}

async function loadCampaigns(el) {
  const res = await MB.get('/admin/campaigns');
  el.innerHTML = `<button class="btn btn-primary" style="margin-bottom:16px;" onclick="promptAddCampaign()">+ Add Campaign</button>
    <div class="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Discount</th><th>Dates</th><th>Status</th></tr></thead><tbody>
    ${(res.data || []).map(c => `<tr><td><strong>${c.title}</strong><br><small>${c.titleBn || ''}</small></td><td>${c.type || 'general'}</td><td>${c.discountPercent || 0}%</td><td>${c.startDate || '-'} to ${c.endDate || '-'}</td><td>${c.active !== false ? 'Active' : 'Inactive'}</td></tr>`).join('') || '<tr><td colspan="5">No campaigns yet</td></tr>'}
    </tbody></table></div>`;
}

async function promptAddCampaign() {
  const title = prompt('Campaign title:');
  if (!title) return;
  const discountPercent = parseFloat(prompt('Discount percent:', '0') || '0');
  await MB.post('/admin/campaigns', { title, discountPercent, type: 'general', active: true });
  MB.toast('Campaign added', 'success');
  loadSection('campaigns');
}

async function loadBlogs(el) {
  const res = await MB.get('/blogs/admin/all');
  el.innerHTML = `<button class="btn btn-primary" style="margin-bottom:16px;">+ Add Blog Post</button>
    <div class="table-wrap"><table><thead><tr><th>Title</th><th>Author</th><th>Published</th><th>Views</th><th>Date</th></tr></thead><tbody>
    ${(res.data || []).map(b => `<tr><td>${b.title}</td><td>${b.author || ''}</td><td>${b.published ? 'Yes' : 'Draft'}</td><td>${b.views || 0}</td><td>${MB.formatDate(b.createdAt)}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function loadLabTests(el) {
  const tests = await MB.get('/lab-tests');
  const bookings = await MB.get('/lab-tests/bookings/list');
  el.innerHTML = `<h3>Lab Tests</h3>
    <div class="table-wrap" style="margin-bottom:24px;"><table><thead><tr><th>Name</th><th>Price</th><th>Status</th></tr></thead><tbody>
    ${(tests.data || []).map(t => `<tr><td>${t.name} ${t.nameBn ? '(' + t.nameBn + ')' : ''}</td><td>${MB.formatPrice(t.price)}</td><td>${t.active !== false ? 'Active' : 'Inactive'}</td></tr>`).join('')}
    </tbody></table></div>
    <h3>Bookings</h3>
    <div class="table-wrap"><table><thead><tr><th>Patient</th><th>Phone</th><th>Date</th><th>Status</th></tr></thead><tbody>
    ${(bookings.data || []).map(b => `<tr><td>${b.patientName}</td><td>${b.phone}</td><td>${MB.formatDate(b.createdAt)}</td><td>${b.status}</td></tr>`).join('')}
    </tbody></table></div>`;
}

async function loadPharmacyApps(el) {
  const res = await MB.get('/pharmacy/applications');
  el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Pharmacy</th><th>Owner</th><th>Phone</th><th>Email</th><th>Status</th><th>Date</th><th>Action</th></tr></thead><tbody>
    ${(res.data || []).map(a => `<tr><td>${a.pharmacyName}</td><td>${a.ownerName}</td><td>${a.phone}</td><td>${a.email || '-'}</td><td>${a.status}</td><td>${MB.formatDate(a.createdAt)}</td><td><select onchange="reviewPharmacyApp('${a.id}', this.value)" class="form-control" style="width:100px;"><option value="">Action</option><option value="approved">Approve</option><option value="rejected">Reject</option></select></td></tr>`).join('')}
    </tbody></table></div>`;
}

async function reviewPharmacyApp(id, status) {
  if (!status) return;
  await MB.put(`/pharmacy/applications/${id}/review`, { status });
  MB.toast('Application reviewed', 'success');
  loadSection('pharmacy-apps');
}

async function loadPOS(el) {
  const session = await MB.get('/pos/current-session');
  if (!session.data) {
    el.innerHTML = `<div class="card" style="max-width:400px;text-align:center;">
      <h3>No Open POS Session</h3><p style="margin:12px 0;">Open a cashier session to start selling.</p>
      <div class="form-group"><label>Opening Cash</label><input type="number" id="pos-opening" class="form-control" value="0"></div>
      <button class="btn btn-primary btn-lg" onclick="openPosSession()">Open Session</button>
    </div>`;
    return;
  }
  el.innerHTML = `
    <div class="pos-layout">
      <div class="pos-products">
        <div class="alert alert-info pos-shortcuts">Shortcuts: F2 search/barcode, F8 print receipt, F9 cash payment, Esc clear bill.</div>
        <div class="pos-search-box"><input type="text" id="pos-search" placeholder="Search product or scan barcode..." class="form-control" autocomplete="off"><button class="btn btn-primary btn-sm" onclick="posSearch()">Search</button></div>
        <div id="pos-results"></div>
      </div>
      <div class="pos-bill">
        <div class="pos-bill-header"><h3>Current Bill</h3><span>Session: ${session.data.id.slice(0, 8)}</span></div>
        <div class="pos-bill-items" id="pos-bill-items"><p style="text-align:center;color:var(--text-muted);padding:20px;">Add products to bill</p></div>
        <div class="pos-bill-footer">
          <div id="pos-discount-row" style="margin-bottom:8px;"><label style="font-size:13px;">Discount: </label><input type="number" id="pos-discount" value="0" style="width:80px;" class="form-control" style="display:inline;width:80px;"></div>
          <div class="pos-total" id="pos-total">Total: ৳0.00</div>
          <div class="form-group"><input type="tel" id="pos-phone" class="form-control" placeholder="Customer phone (optional)"></div>
          <div class="pos-actions">
            <button class="btn btn-primary btn-lg" onclick="completeSale('cash')">Cash</button>
            <button class="btn btn-outline btn-lg" onclick="completeSale('bkash')">bKash</button>
            <button class="btn btn-outline btn-lg" onclick="completeSale('nagad')">Nagad</button>
            <button class="btn btn-outline btn-lg" onclick="completeSale('upay')">Upay</button>
            <button class="btn btn-danger btn-lg" onclick="clearPosBill()">Clear</button>
          </div>
          <button class="btn btn-outline btn-block" id="pos-print-receipt" style="margin-top:12px;" onclick="printLastReceipt()" disabled>Print Receipt</button>
          <button class="btn btn-outline btn-block" style="margin-top:12px;" onclick="refundPosSale()">Refund Sale</button>
          <button class="btn btn-outline btn-block" style="margin-top:12px;" onclick="closePosSession()">Close Session</button>
        </div>
      </div>
    </div>`;
  bindPosShortcuts();
  setTimeout(() => document.getElementById('pos-search')?.focus(), 50);
}

let posBillItems = [];
let lastPosSale = null;

async function openPosSession() {
  const opening = parseFloat(document.getElementById('pos-opening').value) || 0;
  const res = await MB.post('/pos/open-session', { openingCash: opening });
  if (res.success) { MB.toast('POS session opened', 'success'); loadSection('pos'); }
}

async function posSearch() {
  const q = document.getElementById('pos-search').value;
  if (!q) return;
  const res = await MB.get('/search/suggestions?q=' + encodeURIComponent(q) + '&limit=20');
  if (res.success) {
    document.getElementById('pos-results').innerHTML = res.data.map(p => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="addToPosBill('${p.id}','${p.name.replace(/'/g, "\\'")}',${p.sellingPrice || p.mrp || 0})">
        <img src="${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" style="width:40px;height:40px;object-fit:contain;">
        <div style="flex:1;"><strong>${p.name} ${p.strength || ''}</strong><br><small>${p.genericName || ''}</small></div>
        <div style="font-weight:700;color:var(--primary);">${MB.formatPrice(p.sellingPrice || p.mrp)}</div>
      </div>`).join('');
  }
}

function addToPosBill(id, name, price) {
  const existing = posBillItems.find(i => i.productId === id);
  if (existing) { existing.quantity++; } else { posBillItems.push({ productId: id, name, price, quantity: 1 }); }
  renderPosBill();
}

function renderPosBill() {
  const el = document.getElementById('pos-bill-items');
  if (posBillItems.length === 0) { el.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Add products</p>'; document.getElementById('pos-total').textContent = 'Total: ৳0.00'; return; }
  el.innerHTML = posBillItems.map((item, i) => `
    <div class="pos-bill-item">
      <span class="name">${item.name}</span>
      <input type="number" class="qty form-control" value="${item.quantity}" min="1" style="width:50px;" onchange="posBillItems[${i}].quantity=parseInt(this.value);renderPosBill()">
      <span class="price">${MB.formatPrice(item.price * item.quantity)}</span>
      <span class="remove" onclick="posBillItems.splice(${i},1);renderPosBill()">&#10005;</span>
    </div>`).join('');
  const subtotal = posBillItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = parseFloat(document.getElementById('pos-discount')?.value || 0);
  document.getElementById('pos-total').textContent = 'Total: ' + MB.formatPrice(subtotal - discount);
}

async function completeSale(method) {
  if (posBillItems.length === 0) { MB.toast('Add items first', 'error'); return; }
  const discount = parseFloat(document.getElementById('pos-discount')?.value || 0);
  const phone = document.getElementById('pos-phone')?.value || '';
  const res = await MB.post('/pos/sale', { items: posBillItems, paymentMethod: method, customerPhone: phone, discount });
  if (res.success) {
    lastPosSale = res.data;
    MB.toast(`Sale complete! Invoice: ${res.data.invoiceNumber}`, 'success');
    posBillItems = [];
    renderPosBill();
    const printButton = document.getElementById('pos-print-receipt');
    if (printButton) printButton.disabled = false;
  } else { MB.toast(res.message || 'Sale failed', 'error'); }
}

function bindPosShortcuts() {
  document.onkeydown = (event) => {
    if (!document.getElementById('pos-search')) return;
    if (event.key === 'F2') { event.preventDefault(); document.getElementById('pos-search')?.focus(); }
    if (event.key === 'F8') { event.preventDefault(); printLastReceipt(); }
    if (event.key === 'F9') { event.preventDefault(); completeSale('cash'); }
    if (event.key === 'Escape') { event.preventDefault(); clearPosBill(); }
  };
}

function clearPosBill() { posBillItems = []; renderPosBill(); }

async function refundPosSale() {
  const saleId = prompt('Enter POS sale ID to refund:');
  if (!saleId) return;
  const reason = prompt('Refund reason:', 'Customer return') || 'Customer return';
  const res = await MB.post('/pos/refund', { saleId, reason });
  if (res.success) {
    MB.toast(`Refund complete: ${MB.formatPrice(res.data.refundTotal)}`, 'success');
    loadSection('pos');
  } else {
    MB.toast(res.message || 'Refund failed', 'error');
  }
}

function printLastReceipt() {
  if (!lastPosSale) { MB.toast('Complete a sale first', 'error'); return; }
  const receipt = window.open('', '_blank', 'width=380,height=640');
  if (!receipt) { MB.toast('Popup blocked. Allow popups to print receipt.', 'error'); return; }
  receipt.document.write(`<!DOCTYPE html><html><head><title>${lastPosSale.invoiceNumber}</title><style>body{font-family:Arial,sans-serif;padding:16px;max-width:320px}h2,p{margin:4px 0}.row{display:flex;justify-content:space-between;border-bottom:1px dashed #ccc;padding:6px 0}.total{font-weight:700;font-size:18px;margin-top:10px}</style></head><body><h2>Medicine Bazar</h2><p>Invoice: ${lastPosSale.invoiceNumber}</p><p>Cashier: ${lastPosSale.cashierName || ''}</p><p>${MB.formatDate(lastPosSale.createdAt)}</p>${(lastPosSale.items || []).map(i => `<div class="row"><span>${i.name} x ${i.quantity}</span><span>${MB.formatPrice(i.total)}</span></div>`).join('')}<div class="row"><span>Discount</span><span>${MB.formatPrice(lastPosSale.discount || 0)}</span></div><p class="total">Total: ${MB.formatPrice(lastPosSale.total)}</p><p>Payment: ${lastPosSale.paymentMethod}</p><p>Thank you.</p><script>window.print();<\/script></body></html>`);
  receipt.document.close();
}

async function closePosSession() {
  const closing = prompt('Closing cash amount:');
  if (closing === null) return;
  const res = await MB.post('/pos/close-session', { closingCash: parseFloat(closing), note: '' });
  if (res.success) {
    MB.toast(`Session closed. Expected: ${MB.formatPrice(res.data.expectedCash)}, Actual: ${MB.formatPrice(res.data.closingCash)}, Diff: ${MB.formatPrice(res.data.difference)}`, res.data.difference === 0 ? 'success' : 'warning');
    loadSection('dashboard');
  }
}

async function loadSalesReport(el) {
  const res = await MB.get('/reports/sales');
  if (!res.success) return;
  const d = res.data;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Online Sales</div><div class="value">${MB.formatPrice(d.summary.onlineTotal)}</div><div class="sub">${d.summary.onlineCount} orders</div></div>
      <div class="stat-card teal"><div class="label">POS Sales</div><div class="value">${MB.formatPrice(d.summary.posTotal)}</div><div class="sub">${d.summary.posCount} sales</div></div>
      <div class="stat-card blue"><div class="label">Grand Total</div><div class="value">${MB.formatPrice(d.summary.grandTotal)}</div></div>
    </div>
    <div class="card" style="margin-top:16px;"><h3>Daily Sales</h3>
    <div class="table-wrap"><table><thead><tr><th>Date</th><th>Online</th><th>POS</th><th>Total</th><th>Transactions</th></tr></thead><tbody>
    ${d.daily.map(day => `<tr><td>${day.date}</td><td>${MB.formatPrice(day.online)}</td><td>${MB.formatPrice(day.pos)}</td><td><strong>${MB.formatPrice(day.total)}</strong></td><td>${day.count}</td></tr>`).join('')}
    </tbody></table></div></div>
    <div style="margin-top:12px;"><a href="/api/v1/reports/export/orders" class="btn btn-outline btn-sm" target="_blank">Export Orders CSV</a> <a href="/api/v1/reports/export/pos-sales" class="btn btn-outline btn-sm" target="_blank">Export POS CSV</a></div>`;
}

async function loadStockReport(el) {
  const res = await MB.get('/reports/stock');
  if (!res.success) return;
  const d = res.data;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="label">Total Products</div><div class="value">${d.summary.totalProducts}</div></div>
      <div class="stat-card teal"><div class="label">Total Stock</div><div class="value">${d.summary.totalStock}</div></div>
      <div class="stat-card blue"><div class="label">Total Sold</div><div class="value">${d.summary.totalSold}</div></div>
      <div class="stat-card orange"><div class="label">Low Stock</div><div class="value">${d.summary.lowStockCount}</div></div>
      <div class="stat-card red"><div class="label">Out of Stock</div><div class="value">${d.summary.outOfStockCount}</div></div>
    </div>
    ${d.lowStock.length > 0 ? '<div class="card" style="margin-top:16px;"><h3>Low Stock Items</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Stock</th></tr></thead><tbody>' + d.lowStock.map(p => `<tr><td>${p.name}</td><td>${p.category || ''}</td><td style="color:var(--alert-red);font-weight:700;">${p.stock}</td></tr>`).join('') + '</tbody></table></div></div>' : ''}
    <div style="margin-top:12px;"><a href="/api/v1/reports/export/products" class="btn btn-outline btn-sm" target="_blank">Export Products CSV</a></div>`;
}

async function loadExpiryReport(el) {
  const res = await MB.get('/reports/expiry');
  if (!res.success) return;
  const d = res.data;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card red"><div class="label">Expired</div><div class="value">${d.summary.expiredCount}</div></div>
      <div class="stat-card orange"><div class="label">Expiring (3 months)</div><div class="value">${d.summary.expiringSoonCount}</div></div>
      <div class="stat-card"><div class="label">Expiring (6 months)</div><div class="value">${d.summary.expiringLaterCount}</div></div>
    </div>
    ${d.expired.length > 0 ? '<div class="card" style="margin-top:16px;"><h3 style="color:var(--alert-red);">Expired Items</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Batch</th><th>Expiry</th><th>Stock</th></tr></thead><tbody>' + d.expired.map(p => `<tr><td>${p.name}</td><td>${p.batch || ''}</td><td>${p.expiryDate}</td><td>${p.stock}</td></tr>`).join('') + '</tbody></table></div></div>' : ''}
    ${d.expiringSoon.length > 0 ? '<div class="card" style="margin-top:16px;"><h3 style="color:var(--offer-orange);">Expiring Soon (within 3 months)</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Batch</th><th>Expiry</th><th>Stock</th></tr></thead><tbody>' + d.expiringSoon.map(p => `<tr><td>${p.name}</td><td>${p.batch || ''}</td><td>${p.expiryDate}</td><td>${p.stock}</td></tr>`).join('') + '</tbody></table></div></div>' : ''}`;
}

async function loadRefundsReport(el) {
  const res = await MB.get('/reports/refunds');
  if (!res.success) return;
  const d = res.data;
  el.innerHTML = `<div class="stats-grid">
      <div class="stat-card red"><div class="label">Refunds</div><div class="value">${d.summary.count}</div></div>
      <div class="stat-card orange"><div class="label">Refund Amount</div><div class="value">${MB.formatPrice(d.summary.totalAmount)}</div></div>
    </div>
    <div class="table-wrap" style="margin-top:16px;"><table><thead><tr><th>Refund #</th><th>Invoice</th><th>Amount</th><th>Reason</th><th>Date</th></tr></thead><tbody>
    ${(d.refunds || []).map(r => `<tr><td>${r.refundNumber}</td><td>${r.invoiceNumber || '-'}</td><td>${MB.formatPrice(r.refundTotal)}</td><td>${r.reason || '-'}</td><td>${MB.formatDate(r.createdAt)}</td></tr>`).join('') || '<tr><td colspan="5">No refunds yet</td></tr>'}
    </tbody></table></div>`;
}

async function loadAnalytics(el) {
  const res = await MB.get('/reports/analytics');
  if (!res.success) return;
  const d = res.data;
  el.innerHTML = `<div class="stats-grid">
      <div class="stat-card"><div class="label">Products</div><div class="value">${d.summary.productCount}</div></div>
      <div class="stat-card blue"><div class="label">Orders</div><div class="value">${d.summary.orderCount}</div></div>
      <div class="stat-card teal"><div class="label">POS Sales</div><div class="value">${d.summary.posSaleCount}</div></div>
      <div class="stat-card orange"><div class="label">Revenue</div><div class="value">${MB.formatPrice(d.summary.revenue)}</div></div>
    </div>
    <div class="chart-grid" style="margin-top:16px;">
      <div class="chart-card"><h3>Top Products</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Sold</th><th>Stock</th></tr></thead><tbody>${(d.topProducts || []).map(p => `<tr><td>${p.name}</td><td>${p.soldCount}</td><td>${p.stockQuantity}</td></tr>`).join('') || '<tr><td colspan="3">No sales data yet</td></tr>'}</tbody></table></div></div>
      <div class="chart-card"><h3>Zero-result Searches</h3><div class="table-wrap"><table><thead><tr><th>Query</th><th>Date</th></tr></thead><tbody>${(d.zeroResultSearches || []).map(s => `<tr><td>${s.query}</td><td>${MB.formatDate(s.createdAt || s.timestamp)}</td></tr>`).join('') || '<tr><td colspan="2">No zero-result searches</td></tr>'}</tbody></table></div></div>
    </div>`;
}

async function loadSearchReport(el) {
  const res = await MB.get('/reports/search-logs');
  if (!res.success) {
    el.innerHTML = '<div class="alert alert-error">Failed to load search logs</div>';
    return;
  }
  const logs = res.data || [];
  
  // Calculate top failed search queries
  const queryCounts = {};
  logs.forEach(log => {
    const q = (log.query || log.noResultTerm || '').trim().toLowerCase();
    if (q) {
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    }
  });
  
  const topFailed = Object.entries(queryCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card red">
        <div class="label">Total Failed Searches</div>
        <div class="value">${logs.length}</div>
        <div class="sub">Last 100 failed searches</div>
      </div>
      <div class="stat-card orange">
        <div class="label">Unique Failed Queries</div>
        <div class="value">${Object.keys(queryCounts).length}</div>
        <div class="sub">Unique terms missing</div>
      </div>
    </div>
    
    <div class="chart-grid" style="margin-top:16px;">
      <div class="chart-card">
        <h3>Top Failed Queries</h3>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px;">What your customers are looking for, but not finding.</p>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Query</th>
                <th>Search Count</th>
              </tr>
            </thead>
            <tbody>
              ${topFailed.map(item => `
                <tr>
                  <td><strong style="color:var(--alert-red);">${item.query}</strong></td>
                  <td><strong>${item.count}</strong> times</td>
                </tr>
              `).join('') || '<tr><td colspan="2">No failed queries recorded yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="chart-card">
        <h3>Search Logs Analysis</h3>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:12px;">Summary breakdown of search sources.</p>
        <div class="metric-bars">
          ${(() => {
            const sources = {};
            logs.forEach(l => { sources[l.source || 'unknown'] = (sources[l.source || 'unknown'] || 0) + 1; });
            return Object.entries(sources).map(([src, cnt]) => {
              const pct = logs.length > 0 ? Math.round((cnt / logs.length) * 100) : 0;
              const sourceLabel = src === 'search_products' ? 'Product Search' : src === 'search_suggestions' ? 'Autocomplete Suggestions' : src;
              return `<div><span>${sourceLabel}</span><strong>${cnt} (${pct}%)</strong><i style="width:${pct}%"></i></div>`;
            }).join('') || '<div><span>No sources recorded</span><strong>0</strong><i style="width:0%"></i></div>';
          })()}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <h3>Recent Failed Searches</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Query</th>
              <th>Source</th>
              <th>Filters</th>
              <th>Date/Time</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => `
              <tr>
                <td><strong style="color:var(--alert-red);">${log.query || log.noResultTerm || ''}</strong></td>
                <td><span class="badge-role select" style="background:var(--bg);color:var(--text-secondary);border:1px solid var(--border);padding:2px 6px;border-radius:4px;font-size:11px;">${log.source || 'unknown'}</span></td>
                <td><small style="color:var(--text-muted);">${log.filters && Object.keys(log.filters).length > 0 ? JSON.stringify(log.filters) : '-'}</small></td>
                <td>${MB.formatDate(log.timestamp || log.createdAt)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted);">No recent failed searches. Your users are finding everything!</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
