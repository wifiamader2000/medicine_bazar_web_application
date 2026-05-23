# Medicine Bazar V3

Your trusted pharmacy partner.

## Local URLs

### Development Mode

- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5050`

`5173` is the React/Vite development UI with hot reload. `5050` is the backend API server for auth, products, orders, POS, invoices, accounting, uploads and payment proof APIs.

Run in two terminals:

```bash
npm.cmd start
npm.cmd run dev:react
```

### Production-like Local Mode

```bash
npm.cmd run build:react
npm.cmd start
```

Open:

```text
http://127.0.0.1:5050
```

In this mode, port `5050` serves both the backend API and the built React frontend.

## Login

- Login page: `/login`
- Admin panel: `/admin`
- Local admin email: `admin@medicinebazar.com`
- Local development password: `Admin@12345!`

Never use the local development password in production. Passwords must be rotated before deployment, and production credentials must come from secure environment variables or secret management.

## Database

Current storage support:

- MongoDB is supported and recommended for full local/staging testing.
- JSON fallback is supported for local/dev/test.
- Production should use MongoDB now.
- PostgreSQL is a future roadmap item only, not the current production migration target.

JSON fallback files include:

- Products: `database/mb_products.json`
- Users: `database/mb_users.json`
- Orders: `database/mb_orders.json`
- Prescriptions: `database/mb_prescriptions.json`
- Banners: `database/mb_banners.json`

## Completed V3 Modules

- Receipt & Invoice System
- Accounting + Daily Cash Closing
- Customer Due / CRM
- Export Center
- Notification Templates / Provider-ready SMS/Email
- Payment Gateway Structure / bKash/Nagad/SSLCommerz placeholder
- PostgreSQL Migration Roadmap

## Payment Status

Manual payment active:

- COD
- bKash
- Nagad
- Upay
- Merchant link

Auto gateway structures for bKash Auto, Nagad Auto and SSLCommerz are ready but disabled unless real credentials exist. No fake OTP, PIN or success flow should be claimed.

## Current Status

Medicine Bazar V3 is local visual-QA approved, code-side staging-ready, and release-locked locally. Remote push may still be pending. Live production is pending hosting, domain, SSL and live smoke QA.

Do not claim production ready until VPS/hosting, DNS, SSL, live API, live frontend, admin login, POS, checkout, invoice, payment proof, accounting and backup all work on the live environment.

Full Bengali website plan: `docs/FULL_WEBSITE_PLAN_BN.md`
