/* Admin Panel JS */
(function() {
  MB.loadUser();
  if (!MB.isLoggedIn() || !MB.isStaff()) {
    window.location.href = '/login?redirect=/admin';
    return;
  }

  const userInfo = document.getElementById('admin-user-info');
  if (userInfo) {
    userInfo.innerHTML = `<div class="name">${MB.user.name}</div><div class="role">${MB.user.role}</div>`;
  }

  // Load initial section from hash
  const hash = window.location.hash.substring(1) || 'dashboard';
  loadSection(hash);
})();

async function loadSection(section) {
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
      case 'coupons': title.textContent = 'Coupons'; await loadCoupons(content); break;
      case 'blogs': title.textContent = 'Blog Posts'; await loadBlogs(content); break;
      case 'lab-tests': title.textContent = 'Lab Tests'; await loadLabTests(content); break;
      case 'pharmacy-apps': title.textContent = 'Pharmacy Applications'; await loadPharmacyApps(content); break;
      case 'pos': title.textContent = 'Point of Sale'; await loadPOS(content); break;
      case 'reports-sales': title.textContent = 'Sales Report'; await loadSalesReport(content); break;
      case 'reports-stock': title.textContent = 'Stock Report'; await loadStockReport(content); break;
      case 'reports-expiry': title.textContent = 'Expiry Report'; await loadExpiryReport(content); break;
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
      <div class="chart-card"><h3>Sales Overview</h3><div class="chart-placeholder">Online: ${MB.formatPrice(d.onlineSalesTotal)} | POS: ${MB.formatPrice(d.posSalesTotal)}</div></div>
      <div class="chart-card"><h3>Stock Status</h3><div class="chart-placeholder">Sold: ${d.soldPercentage}% | Remaining: ${d.remainingStockPercentage}%</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;">
      ${d.categoryBreakdown && d.categoryBreakdown.length > 0 ? '<div class="card"><h3 style="margin-bottom:12px;">Products by Category</h3><div class="table-wrap"><table><thead><tr><th>Category</th><th>Count</th><th>%</th></tr></thead><tbody>' + d.categoryBreakdown.map(c => '<tr><td>' + c.name + '</td><td><strong>' + c.count + '</strong></td><td>' + ((c.count / (d.activeProducts || d.totalProducts || 1)) * 100).toFixed(1) + '%</td></tr>').join('') + '</tbody></table></div></div>' : ''}
      ${d.topProducts && d.topProducts.length > 0 ? '<div class="card"><h3 style="margin-bottom:12px;">Top Selling Products</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Sold</th><th>Stock</th></tr></thead><tbody>' + d.topProducts.map(p => '<tr><td>' + p.name + (p.strength ? ' ' + p.strength : '') + '</td><td><strong>' + p.sold + '</strong></td><td>' + p.stock + '</td></tr>').join('') + '</tbody></table></div></div>' : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;">
      ${d.topManufacturers && d.topManufacturers.length > 0 ? '<div class="card"><h3 style="margin-bottom:12px;">Top Manufacturers</h3><div class="table-wrap"><table><thead><tr><th>Manufacturer</th><th>Products</th></tr></thead><tbody>' + d.topManufacturers.map(m => '<tr><td>' + m.name + '</td><td><strong>' + m.count + '</strong></td></tr>').join('') + '</tbody></table></div></div>' : ''}
      ${d.lowStockItems && d.lowStockItems.length > 0 ? '<div class="card"><h3 style="margin-bottom:12px;">Low Stock Items</h3><div class="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th></tr></thead><tbody>' + d.lowStockItems.map(p => '<tr><td>' + p.name + '</td><td style="color:var(--alert-red);font-weight:700;">' + p.stock + '</td></tr>').join('') + '</tbody></table></div></div>' : ''}
    </div>`;

  // Update sidebar badges
  const pendingOrdersBadge = document.getElementById('pending-orders-count');
  if (pendingOrdersBadge && d.pendingOrders > 0) { pendingOrdersBadge.textContent = d.pendingOrders; pendingOrdersBadge.style.display = 'inline'; }
  const pendingRxBadge = document.getElementById('pending-rx-count');
  if (pendingRxBadge && d.pendingPrescriptions > 0) { pendingRxBadge.textContent = d.pendingPrescriptions; pendingRxBadge.style.display = 'inline'; }
}

async function loadProducts(el) {
  const res = await MB.get('/products?limit=50');
  if (!res.success) { el.innerHTML = '<div class="alert alert-error">Failed to load products</div>'; return; }
  el.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:16px;"><span>${res.pagination.total} total products</span></div>
    <div class="table-wrap"><table><thead><tr><th>Name</th><th>Generic</th><th>Category</th><th>MRP</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th></tr></thead><tbody>
    ${res.data.map(p => `<tr><td><strong>${p.name}</strong> ${p.strength || ''}<br><small style="color:var(--text-muted);">${p.nameBn || ''}</small></td><td>${p.genericName || ''}</td><td>${p.category || ''}</td><td>${MB.formatPrice(p.mrp)}</td><td>${MB.formatPrice(p.sellingPrice)}</td><td>${p.stockQuantity || 0}</td><td>${p.soldCount || 0}</td><td>${p.active !== false ? '<span style="color:var(--primary);">Active</span>' : '<span style="color:var(--alert-red);">Inactive</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function loadImport(el) {
  el.innerHTML = `
    <div class="card" style="max-width:600px;">
      <h3 style="margin-bottom:16px;">Import Products</h3>
      <p style="margin-bottom:12px;color:var(--text-secondary);">Upload CSV, Excel (.xlsx), or TXT file with product data.</p>
      <div class="form-group"><label>Select File</label><input type="file" id="import-file" class="form-control" accept=".csv,.xlsx,.xls,.txt"></div>
      <button class="btn btn-primary" onclick="previewImport()">Preview Import</button>
    </div>
    <div id="import-preview" style="margin-top:20px;"></div>`;
}

async function previewImport() {
  const file = document.getElementById('import-file').files[0];
  if (!file) { MB.toast('Select a file', 'error'); return; }
  const fd = new FormData(); fd.append('file', file);
  const res = await MB.upload('/admin/import/upload', fd);
  if (!res.success) { MB.toast(res.message || 'Upload failed', 'error'); return; }
  const d = res.data;
  document.getElementById('import-preview').innerHTML = `
    <div class="card">
      <h3>Import Preview</h3>
      <div class="stats-grid" style="margin:16px 0;">
        <div class="stat-card"><div class="label">Total Rows</div><div class="value">${d.totalRows}</div></div>
        <div class="stat-card"><div class="label">Valid</div><div class="value">${d.validRows}</div></div>
        <div class="stat-card red"><div class="label">Invalid</div><div class="value">${d.invalidRows}</div></div>
        <div class="stat-card orange"><div class="label">Duplicates</div><div class="value">${d.duplicates}</div></div>
        <div class="stat-card teal"><div class="label">New Products</div><div class="value">${d.newProducts}</div></div>
      </div>
      ${d.newProducts > 0 ? `<button class="btn btn-primary btn-lg" onclick="commitImport('${d.importId}', ${JSON.stringify(d.preview).replace(/'/g, "\\'")})" >Import ${d.newProducts} Products</button>` : '<div class="alert alert-warning">No new products to import</div>'}
      ${d.invalidRows > 0 ? '<h4 style="margin-top:16px;">Invalid Rows:</h4><div class="table-wrap"><table><thead><tr><th>Row</th><th>Error</th></tr></thead><tbody>' + d.invalidDetails.map(r => `<tr><td>${r.row}</td><td>${r.error}</td></tr>`).join('') + '</tbody></table></div>' : ''}
    </div>`;
}

async function commitImport(importId, products) {
  const res = await MB.post('/admin/import/commit', { importId, products });
  if (res.success) { MB.toast(`${res.data.count} products imported!`, 'success'); loadSection('products'); }
  else MB.toast(res.message || 'Import failed', 'error');
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
  el.innerHTML = `<div class="form-group" style="max-width:400px;"><label>Upload Media</label><input type="file" id="media-file" class="form-control" accept="image/*"><button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="uploadMedia()">Upload</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:20px;">
    ${(res.data || []).map(m => `<div class="card" style="padding:8px;text-align:center;"><img src="${m.url}" style="width:100%;height:120px;object-fit:contain;border-radius:4px;"><p style="font-size:11px;margin-top:4px;word-break:break-all;">${m.originalName || m.fileName}</p></div>`).join('')}
    </div>`;
}

async function uploadMedia() {
  const file = document.getElementById('media-file').files[0];
  if (!file) return;
  const fd = new FormData(); fd.append('file', file);
  const res = await MB.upload('/admin/media', fd);
  if (res.success) { MB.toast('Uploaded', 'success'); loadSection('media'); }
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
        <div class="search-bar" style="margin-bottom:16px;"><input type="text" id="pos-search" placeholder="Search by name, generic, barcode..." class="form-control" oninput="debouncePosSearch()" onkeydown="if(event.key==='Enter')posSearch()"><button class="btn btn-primary btn-sm" style="position:absolute;right:4px;top:4px;" onclick="posSearch()">Search</button></div>
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
            <button class="btn btn-danger btn-lg" onclick="clearPosBill()">Clear</button>
          </div>
          <button class="btn btn-outline btn-block" style="margin-top:12px;" onclick="closePosSession()">Close Session</button>
        </div>
      </div>
    </div>`;
}

let posBillItems = [];

async function openPosSession() {
  const opening = parseFloat(document.getElementById('pos-opening').value) || 0;
  const res = await MB.post('/pos/open-session', { openingCash: opening });
  if (res.success) { MB.toast('POS session opened', 'success'); loadSection('pos'); }
}

let posSearchTimer;
function debouncePosSearch() {
  clearTimeout(posSearchTimer);
  posSearchTimer = setTimeout(posSearch, 250);
}

async function posSearch() {
  const q = document.getElementById('pos-search').value.trim();
  if (!q) { document.getElementById('pos-results').innerHTML = ''; return; }
  const res = await MB.get('/search/suggestions?q=' + encodeURIComponent(q) + '&limit=20');
  if (res.success) {
    if (res.data.length === 0) {
      document.getElementById('pos-results').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No products found for "' + q.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') + '"</p>';
      return;
    }
    document.getElementById('pos-results').innerHTML = res.data.map(p => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 8px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''" onclick="addToPosBill('${p.id}','${p.name.replace(/'/g, "\\'")}',${p.sellingPrice || p.mrp || 0})">
        <img src="${p.imageUrl || '/assets/images/medicine-placeholder.svg'}" style="width:40px;height:40px;object-fit:contain;border-radius:6px;">
        <div style="flex:1;"><strong>${p.name} ${p.strength || ''}</strong><br><small style="color:var(--text-muted);">${p.genericName || ''} ${p.manufacturer ? '&bull; ' + p.manufacturer : ''}</small></div>
        <div style="text-align:right;"><div style="font-weight:700;color:var(--primary);">${MB.formatPrice(p.sellingPrice || p.mrp)}</div><small style="color:var(--text-muted);">Stock: ${p.stockQuantity || 0}</small></div>
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
    MB.toast(`Sale complete! Invoice: ${res.data.invoiceNumber}`, 'success');
    posBillItems = [];
    renderPosBill();
  } else { MB.toast(res.message || 'Sale failed', 'error'); }
}

function clearPosBill() { posBillItems = []; renderPosBill(); }

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
