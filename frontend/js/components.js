const MB_COMPONENTS = {
  header(active = '') {
    const nav = [
      ['/', 'Home', 'হোম', 'home'],
      ['/shop', 'Shop', 'শপ', 'shop'],
      ['/shop#categories', 'Categories', 'ক্যাটাগরি', 'categories'],
      ['/prescription-upload', 'Prescription', 'প্রেসক্রিপশন', 'prescription'],
      ['/lab-tests', 'Lab Tests', 'ল্যাব টেস্ট', 'lab'],
      ['/blog', 'Blog', 'ব্লগ', 'blog'],
      ['/contact', 'Contact', 'যোগাযোগ', 'contact'],
    ];
    return `
      <header class="header">
        <div class="header-top">
          <div class="container topbar-grid">
            <div>Support: <a href="tel:01602444532">01602444532</a> | WhatsApp/IMO: <a href="https://wa.me/8801602444532" target="_blank">01602444532</a></div>
            <div class="topbar-actions">
              <div class="lang-switch"><button data-lang="en">EN</button><button data-lang="bn">বাংলা</button></div>
              <a href="/login" data-en="Login / Account" data-bn="লগইন / অ্যাকাউন্ট">Login / Account</a>
            </div>
          </div>
        </div>
        <div class="header-main">
          <div class="container">
            <a href="/" class="logo" aria-label="Medicine Bazar">
              <img src="/assets/images/medicine-placeholder.svg" alt="Medicine Bazar logo" id="header-logo">
              <div class="logo-text"><span data-en="Medicine Bazar" data-bn="মেডিসিন বাজার">Medicine Bazar</span><small data-en="Original medicine, safer care" data-bn="অরিজিনাল ঔষধ, নিরাপদ সেবা">Original medicine, safer care</small></div>
            </a>
            <div class="search-bar search-bar-xl">
              <input type="text" id="search-input" placeholder="Search Napa, Paracetamol, fever medicine..." data-en-placeholder="Search Napa, Paracetamol, fever medicine..." data-bn-placeholder="নাপা, প্যারাসিটামল, জ্বরের ওষুধ খুঁজুন...">
              <button aria-label="Search" onclick="MB.goSearch()">&#128269;</button>
              <div id="search-suggestions" class="search-suggestions"></div>
            </div>
            <div class="header-actions">
              <a href="/prescription-upload" class="header-pill rx-pill"><span class="icon">&#128196;</span><span data-en="Prescription" data-bn="প্রেসক্রিপশন">Prescription</span></a>
              <div id="auth-area"></div>
              <a href="/cart" class="header-pill"><span class="icon">&#128722;</span><span data-en="Cart" data-bn="কার্ট">Cart</span><span class="cart-count" style="display:none">0</span></a>
              <button class="mobile-menu-btn" aria-label="Menu">&#9776;</button>
            </div>
          </div>
        </div>
        <nav class="header-nav">
          <div class="container">
            ${nav.map(([href, en, bn, key]) => `<a href="${href}" class="nav-link ${active === key ? 'active' : ''}" data-en="${en}" data-bn="${bn}">${en}</a>`).join('')}
          </div>
        </nav>
      </header>`;
  },

  footer() {
    return `
      <footer class="footer">
        <div class="container footer-brand-row">
          <div>
            <h2>Medicine Bazar</h2>
            <p data-en="Your trusted online and counter pharmacy platform for genuine medicines, prescriptions, lab tests, and manual payments." data-bn="অরিজিনাল ঔষধ, প্রেসক্রিপশন, ল্যাব টেস্ট ও ম্যানুয়াল পেমেন্টের জন্য আপনার বিশ্বস্ত ফার্মেসি প্ল্যাটফর্ম।">Your trusted online and counter pharmacy platform for genuine medicines, prescriptions, lab tests, and manual payments.</p>
          </div>
          <a class="btn btn-white" href="https://wa.me/8801602444532" target="_blank">WhatsApp Order</a>
        </div>
        <div class="container">
          <div class="footer-grid">
            <div class="footer-col">
              <h3>Contact</h3>
              <p>Phone: 01602444532</p>
              <p>WhatsApp/IMO: 01602444532</p>
              <p>support@medicinebazar.com</p>
            </div>
            <div class="footer-col">
              <h3>Explore</h3>
              <a href="/shop">Shop</a><a href="/prescription-upload">Upload Prescription</a><a href="/lab-tests">Lab Tests</a><a href="/pharmacy-registration">Register Pharmacy</a><a href="/blog">Health Blog</a>
            </div>
            <div class="footer-col">
              <h3>Policies</h3>
              <a href="/about">About</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/return">Return</a><a href="/faq">FAQ</a>
            </div>
            <div class="footer-col">
              <h3>Social</h3>
              <a href="https://facebook.com/medicinebazar24" target="_blank">Facebook</a>
              <a href="https://www.youtube.com/@MedicineBazar24" target="_blank">YouTube</a>
              <a href="https://whatsapp.com/channel/0029Vb8A8KwAYlUGFxSkXy01" target="_blank">WhatsApp Channel</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom"><div class="container">&copy; 2026 Medicine Bazar. All rights reserved.</div></div>
        <div class="footer-disclaimer"><div class="container">এই তথ্য শুধুমাত্র সাধারণ জ্ঞানের জন্য। চিকিৎসকের পরামর্শ ছাড়া ওষুধ সেবন করবেন না।</div></div>
      </footer>
      <div class="whatsapp-float"><a href="https://wa.me/8801602444532" target="_blank" title="WhatsApp">&#128172;</a></div>`;
  },

  mount(active = '') {
    document.querySelector('[data-mb-header]')?.replaceWith(htmlToNode(this.header(active)));
    document.querySelector('[data-mb-footer]')?.replaceWith(htmlToNode(this.footer()));
  },
};

function htmlToNode(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}
