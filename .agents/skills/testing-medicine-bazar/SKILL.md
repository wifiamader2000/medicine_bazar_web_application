# Testing Medicine Bazar

## Local Dev Setup

```bash
cd /home/ubuntu/repos/eliotgonj-madrasa-website
npm install
npm run seed && npm run seed:medicines
npm start
# Server runs on http://localhost:5050
```

## Devin Secrets Needed

No external secrets required for local testing. The app uses JSON file-store in development mode.

## Test Credentials

- **Admin**: `admin@medicinebazar.com` / `Admin@MedBazar2024`
- Roles available: admin, customer, cashier, pharmacist, manager

## Key Test Flows

### 1. Homepage
- Navigate to `http://localhost:5050`
- Verify hero text, product cards with ৳ prices, footer with contact 01602444532
- Product count should match seeded data (currently 84)

### 2. Search Autosuggest
- Click search bar in header, type "napa"
- Dropdown should show multiple Napa variants with generic names and prices
- API: `GET /api/v1/search/suggestions?q=napa`

### 3. Admin Dashboard
- Login at `/login` with admin credentials
- Navigate to `/admin` — dashboard shows stat cards (Total Products, Stocked, etc.)
- Sidebar has: Dashboard, Orders, POS, Products, Import, Categories, Brands, Media, Prescriptions, Payments, Lab Tests, Pharmacy Apps, Coupons, Blog, Sales/Stock Reports

### 4. POS System
- In admin panel, click POS in sidebar
- Enter opening cash amount, click "Open Session"
- Search products, click to add to bill
- Bill total updates with correct price
- Payment buttons: Cash, bKash, Nagad

### 5. Language Switching
- Top bar has EN/বাং buttons
- Clicking বাং switches all UI text to Bangla
- Hero becomes "আপনার বিশ্বস্ত ফার্মেসি পার্টনার"
- Clicking EN reverts to English

### 6. Auth Protection
- Unauthenticated access to `/admin` should redirect to `/login?redirect=/admin`
- The `MB.loadUser()` function must be called before any auth checks in page scripts
- Affected files: `admin.js`, `login.html`, `account.html`, `register.html`, `checkout.html`

## API Health Check

```bash
curl http://localhost:5050/api/v1/health
# Should return {"success":true,"data":{"status":"healthy","productCount":84,...}}
```

## Running Tests

```bash
npm test   # 19 API tests
npm run build  # Lint + audit check
```

## Known Gotchas

- **Auth race condition**: If page scripts check `MB.isLoggedIn()` before `MB.loadUser()` is called, users get incorrectly redirected. The fix is to call `MB.loadUser()` at the top of any IIFE or inline script that checks auth state before `DOMContentLoaded`.
- **POS search**: The search button (magnifying glass icon) might need to be clicked to trigger search; autosuggest may not fire on every keystroke depending on debounce timing.
- **Console tool**: The `computer(action="console")` tool may report "Chrome not in foreground" — use `wmctrl -a Chrome` or `xdotool` to focus Chrome first. If it persists, use CDP or navigate via address bar instead.
- **Logout**: The Logout link in the header calls `MB.logout()` which clears localStorage. If clicking it doesn't work visually, opening a new tab/incognito window to `/admin` can verify auth protection.
