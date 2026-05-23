# Medicine Bazar V3 পূর্ণাঙ্গ ওয়েবসাইট প্ল্যান

এই ডকুমেন্টটি Medicine Bazar V3-এর বর্তমান বাস্তব অবস্থা, local run mode, database strategy, completed modules, admin panel, payment system, release status এবং production readiness checklist বোঝার জন্য।

## বর্তমান V3 অবস্থা

- Frontend UI: React/Vite app, folder `frontend-react`
- Backend API: Express server, entry `backend/server.js`
- API base path: `/api/v1`
- Upload folders: `uploads/products`, `uploads/media`, `uploads/logos`, `uploads/prescriptions`
- Admin login page: `/login`
- Admin panel: `/admin`
- POS panel: `/pos`

## Local URLs

### Development Mode

Development mode-এ frontend এবং backend আলাদা process হিসেবে চালানো হয়।

- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5050`

ব্যাখ্যা:

- `5173` হলো React/Vite development UI। UI দ্রুত hot reload করে এবং `/api` request backend `5050`-এ proxy করে।
- `5050` হলো backend API server। API, uploads, auth, admin data, orders, POS, payment proof, invoice, accounting data এখান থেকে কাজ করে।

Development command:

```bash
npm.cmd start
npm.cmd run dev:react
```

### Production-like Local Mode

Production-like local mode-এ React build তৈরি করে Express server সেই build serve করে।

```bash
npm.cmd run build:react
npm.cmd start
```

Open:

```text
http://127.0.0.1:5050
```

ব্যাখ্যা:

- `5050` production-build server হিসেবে frontend এবং backend দুটোই serve করে।
- এই mode local staging/smoke QA-এর জন্য ভালো, কারণ live hosting-এর মতো single server behavior দেখা যায়।

## Database ও Storage Strategy

### Current Supported Storage

- MongoDB supported and recommended for full local/staging test।
- JSON fallback supported for local/dev/test।
- Production should use MongoDB now।
- PostgreSQL migration is future roadmap only, current production target নয়।

### JSON Fallback Data Files

JSON mode ব্যবহার করলে data থাকে:

- Products: `database/mb_products.json`
- Users/Admin/Customer: `database/mb_users.json`
- Orders: `database/mb_orders.json`
- Prescriptions: `database/mb_prescriptions.json`
- Banners: `database/mb_banners.json`
- Categories: `database/mb_categories.json`
- Brands/Manufacturers: `database/mb_brands.json`
- POS sales: `database/mb_pos_sales.json`
- Settings: `database/mb_settings.json`
- Audit logs: `database/mb_audit_logs.json`

### Production Database Rule

Production/live deployment-এ JSON file-store ব্যবহার করা যাবে না। MongoDB connection, backup, restore, secure environment secrets এবং smoke QA complete না হলে live production ready claim করা যাবে না।

## Login

### Local Development Login

- Login page: `/login`
- Admin panel: `/admin`
- Local admin email: `admin@medicinebazar.com`
- Local development password: `Admin@12345!`

Warning:

- Local development password কখনো production-এ ব্যবহার করা যাবে না।
- Deployment-এর আগে password rotate করতে হবে।
- Production password secure env/secret management থেকে আসতে হবে।
- Production credential repository, README, screenshot বা public document-এ রাখা যাবে না।

### Role-based Access

- Admin: `/admin`
- Cashier: `/pos`
- Pharmacist: `/admin/prescriptions`
- Customer: `/account`

### Google / OTP Login

Google login এবং OTP login UI/structure future-ready placeholder হিসেবে থাকতে পারে। Credentials/provider integration না থাকলে এগুলো active production login হিসেবে দাবি করা যাবে না।

## Completed Modules

Medicine Bazar V3-এ নিচের modules code-side completed/structure-ready হিসেবে ধরা হয়েছে:

- Receipt & Invoice System
- Accounting + Daily Cash Closing
- Customer Due / CRM
- Export Center
- Notification Templates / Provider-ready SMS/Email
- Payment Gateway Structure / bKash/Nagad/SSLCommerz placeholder
- PostgreSQL Migration Roadmap

Note: “Completed” মানে local/staging code-side capability present। Live production ready claim করতে হলে hosting, domain, SSL, live smoke QA এবং real provider credential verification লাগবে।

## Payment System

### Manual Payment Active

Active manual payment methods:

- COD
- bKash
- Nagad
- Upay
- Merchant link

Manual payment flow:

- Customer payment method select করবে।
- Customer transaction ID/proof দিলে admin verification queue-তে যাবে।
- Admin verify করলে order confirm/processing হবে।
- Fake OTP, fake PIN, fake auto-success ব্যবহার করা যাবে না।

### Auto Gateway Structure

Structure-ready but disabled unless credentials exist:

- bKash Auto
- Nagad Auto
- SSLCommerz

Rules:

- Gateway credentials না থাকলে auto gateway active বলা যাবে না।
- No fake OTP/PIN/success।
- Real gateway sandbox/live credential দিয়ে only verified integration active হবে।

## Public Website Pages

### Home `/`

কাজ:

- Hero banner, search, category shortcut, prescription CTA।
- Trending medicines।
- Payment instruction।
- WhatsApp support, call support, upload prescription action।

Buttons:

- Search: `/search?q=...`
- Shop Medicines: `/shop`
- Upload Prescription: `/prescription-upload`
- WhatsApp Order: external WhatsApp link
- Call Pharmacist: phone dial link

### Shop `/shop`

কাজ:

- Product browse।
- Category, brand, price, stock, prescription filter।
- Product card থেকে detail page।

### Search `/search`

কাজ:

- Medicine, generic, manufacturer, category, indication search।
- Zero-result search log।
- Future MeiliSearch/Algolia adapter support।

### Product Detail `/product/:slug`

কাজ:

- Medicine name, strength, generic, manufacturer, price, stock।
- Prescription required badge।
- Alternatives/substitutes।
- Related products।

### Checkout `/checkout`

কাজ:

- Product review।
- Customer info।
- Delivery address।
- Payment method।
- Prescription upload/proof upload where needed।

### Prescription Upload `/prescription-upload`

কাজ:

- Prescription image/PDF upload।
- Customer phone/name।
- Pharmacist review queue entry।

### Login `/login`

কাজ:

- Email-password login।
- Customer sign up।
- Forgot password।
- Future Google/OTP placeholders।

## Customer Panel `/account`

Current/Future responsibilities:

- Customer dashboard।
- Order history।
- Prescription status।
- Saved address।
- Due/customer balance view if enabled।
- Profile/password change।

## Admin Pages

### Dashboard `/admin`

- Sales summary।
- Orders।
- Prescriptions।
- Inventory alerts।
- Quick tasks।

### Accounting `/admin/accounting`

- Sales, expenses, refunds, ledger, balance।
- Cash and due tracking।
- Accounting overview।

### Day Closing `/admin/day-closing`

- Daily cash close।
- POS sale total।
- Online payment total।
- Refund/expense check।
- Closing summary।

### Customers / CRM `/admin/customers`

- Customer list।
- Phone/email।
- Order history।
- Customer due/CRM follow-up।

### Invoices `/admin/invoices`

- Receipt/invoice list।
- Order/POS invoice source।
- Printable invoice workflow।

### Online Orders `/admin/orders`

- Website checkout orders।
- Payment status।
- Delivery status।
- Prescription-linked order tracking।

### Export Center `/admin/export`

- Products/orders/customers/report export।
- CSV/report workflow।

### Notifications `/admin/notifications`

- SMS/email templates।
- Provider-ready notification structure।
- Notification logs future-ready।

### Payment Gateways `/admin/payment-gateways`

- COD, bKash, Nagad, Upay, Merchant link setup।
- bKash Auto, Nagad Auto, SSLCommerz credentials placeholder।
- Auto gateways disabled unless real credentials exist।

### Prescription Queue `/admin/prescriptions`

- Uploaded prescription review।
- Approve/reject।
- Call customer।
- Create order from prescription।

### Banners `/admin/banners`

- Hero/offer/payment/prescription banners।
- Image, title, subtitle, link, active status, date, priority।

### Inventory & POS `/admin/inventory`

- Stock quantity।
- Low stock alert।
- Product inventory view।

### Mega Catalog `/admin/products`

- Product create/edit/import।
- Product image assign।
- Category/brand/generic fields।

### Settings `/admin/settings`

- Site name, phone, social links।
- Logo/media settings।
- Future credential settings।

## POS `/pos`

Role:

- Admin এবং cashier।

কাজ:

- Counter sale।
- Product search।
- Cart।
- Discount।
- Payment collect।
- Receipt।
- Inventory stock update।

## Banner Plan

Banner types:

- Hero: homepage first section।
- Offer: discount/campaign।
- Prescription: upload prescription CTA।
- Payment: bKash/Nagad/Upay/COD instruction।
- Category: category landing promotion।

Rules:

- Real product/category visuals preferred।
- CTA route valid হতে হবে।
- Payment banner-এ fake gateway success claim করা যাবে না।

## Current Status

Medicine Bazar V3 is:

- Local visual QA approved।
- Code-side staging-ready।
- Release-locked locally।
- Pending remote push if applicable।
- Live production pending hosting/domain/SSL/live smoke QA।

## Do Not Claim Production Ready Until

Live production ready claim করা যাবে না যতক্ষণ না:

- VPS/hosting works।
- Domain DNS works।
- SSL active।
- Live API responds।
- Live frontend opens।
- Admin login works।
- POS works।
- Checkout works।
- Invoice works।
- Payment proof works।
- Accounting works।
- Backup works।

## Future Roadmap

### Phase 1: Stabilize

- React frontend + Express backend route consistency।
- MongoDB staging verification।
- JSON fallback retained for local/dev/test।
- Admin routes complete।
- Visual QA every main route।

### Phase 2: Production Operations

- MongoDB production connection।
- Backup and restore workflow।
- Environment-specific config।
- Live smoke QA checklist।

### Phase 3: Commerce Completion

- Cart persistence।
- Checkout order lifecycle।
- Payment proof approval।
- Delivery status tracking।
- Invoice PDF।

### Phase 4: Pharmacy Operations

- Prescription verification workflow।
- Generic substitute recommendation।
- Low-stock and expiry alerts।
- Purchase order and supplier management।

### Phase 5: Growth

- SEO pages।
- Blog/health tips।
- Campaign banners।
- WhatsApp channel integration।
- Google login।
- SMS OTP।

## Quality Checklist

- Home, shop, search, product, checkout, login, admin, POS route must load।
- No mojibake text।
- Mobile header/footer should not overlap।
- Admin nav link should not open 404।
- API `/api/v1/products` returns products।
- Login should redirect by role।
- Upload folders must exist।
- Production must not use local development password।
