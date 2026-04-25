/* Shared page components - header/footer injection */
const PAGE_HEADER = `
<header class="header">
  <div class="header-top">
    <div class="container">
      <div><span data-en="Need Help?" data-bn="সাহায্য দরকার?">Need Help?</span> <a href="tel:01602444532">01602444532</a></div>
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="lang-switch"><button data-lang="en" class="active">EN</button><button data-lang="bn">বাং</button></div>
      </div>
    </div>
  </div>
  <div class="header-main">
    <div class="container">
      <a href="/" class="logo">
        <img src="/assets/images/medicine-placeholder.svg" alt="Medicine Bazar" id="header-logo">
        <div class="logo-text"><span data-en="Medicine Bazar" data-bn="মেডিসিন বাজার">Medicine Bazar</span><small data-en="Your Trusted Pharmacy" data-bn="আপনার বিশ্বস্ত ফার্মেসি">Your Trusted Pharmacy</small></div>
      </a>
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="Search medicines...">
        <button onclick="document.getElementById('search-input').value&&(window.location.href='/search?q='+encodeURIComponent(document.getElementById('search-input').value))">&#128269;</button>
        <div id="search-suggestions" class="search-suggestions"></div>
      </div>
      <div class="header-actions">
        <div id="auth-area"></div>
        <a href="/cart" class="header-btn"><span class="icon">&#128722;</span><span data-en="Cart" data-bn="কার্ট">Cart</span><span class="cart-count" style="display:none">0</span></a>
        <button class="mobile-menu-btn" aria-label="Menu">&#9776;</button>
      </div>
    </div>
  </div>
  <nav class="header-nav">
    <div class="container">
      <a href="/" class="nav-link" data-en="Home" data-bn="হোম">Home</a>
      <a href="/shop" class="nav-link" data-en="Shop" data-bn="শপ">Shop</a>
      <a href="/prescription-upload" class="nav-link" data-en="Upload Prescription" data-bn="প্রেসক্রিপশন আপলোড">Upload Prescription</a>
      <a href="/lab-tests" class="nav-link" data-en="Lab Tests" data-bn="ল্যাব টেস্ট">Lab Tests</a>
      <a href="/blog" class="nav-link" data-en="Health Blog" data-bn="স্বাস্থ্য ব্লগ">Health Blog</a>
      <a href="/about" class="nav-link" data-en="About" data-bn="সম্পর্কে">About</a>
      <a href="/contact" class="nav-link" data-en="Contact" data-bn="যোগাযোগ">Contact</a>
    </div>
  </nav>
</header>`;

const PAGE_FOOTER = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <h3>Medicine Bazar</h3>
        <p>Your trusted pharmacy partner for genuine medicines, online ordering, and home delivery.</p>
        <div class="footer-social">
          <a href="https://facebook.com/medicinebazar24" target="_blank">f</a>
          <a href="https://www.youtube.com/@MedicineBazar24" target="_blank">&#9654;</a>
          <a href="https://wa.me/8801602444532" target="_blank">W</a>
        </div>
      </div>
      <div class="footer-col">
        <h3>Quick Links</h3>
        <a href="/shop">Shop</a><a href="/prescription-upload">Upload Prescription</a><a href="/lab-tests">Lab Tests</a><a href="/blog">Health Blog</a>
      </div>
      <div class="footer-col">
        <h3>Policies</h3>
        <a href="/about">About Us</a><a href="/privacy">Privacy Policy</a><a href="/terms">Terms & Conditions</a><a href="/return">Return Policy</a><a href="/faq">FAQ</a>
      </div>
      <div class="footer-col">
        <h3>Contact</h3>
        <p>&#128222; 01602444532</p><p>&#128231; support@medicinebazar.com</p>
        <p><a href="https://wa.me/8801602444532" target="_blank" style="color:rgba(255,255,255,0.7);">WhatsApp: 01602444532</a></p>
      </div>
    </div>
  </div>
  <div class="footer-bottom"><div class="container">&copy; 2024 Medicine Bazar. All rights reserved.</div></div>
  <div class="footer-disclaimer"><div class="container">Disclaimer: Always consult your doctor before taking any medicine.</div></div>
</footer>
<div class="whatsapp-float"><a href="https://wa.me/8801602444532" target="_blank" title="WhatsApp">&#128172;</a></div>`;
