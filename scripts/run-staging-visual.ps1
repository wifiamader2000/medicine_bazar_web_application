$pages = @(
  @('home', '/', ''),
  @('shop', '/shop', ''),
  @('search', '/search?q=napa', ''),
  @('product', '/product/auto', ''),
  @('checkout', '/checkout', 'customer'),
  @('prescription-upload', '/prescription-upload', 'customer'),
  @('login', '/login', ''),
  @('admin-dashboard', '/admin/dashboard.html', 'admin'),
  @('admin-pos', '/admin/pos.html', 'cashier')
)
$views = @(@(1366, 768), @(390, 844))

foreach ($page in $pages) {
  foreach ($view in $views) {
    node scripts/staging-visual-single.js $page[0] $page[1] $view[0] $view[1] $page[2]
  }
}

node scripts/staging-visual-single.js admin-pos-tablet /admin/pos.html 900 700 cashier
node scripts/staging-visual-single.js admin-dashboard-tablet /admin/dashboard.html 900 700 admin
