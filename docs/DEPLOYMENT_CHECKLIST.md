# Deployment Checklist

Before going live with the soft launch, ensure the following production requirements are met:

## 1. Domain & SSL
- [ ] Primary domain purchased and connected (e.g., `medicinebazar.com.bd`).
- [ ] SSL Certificate issued and forced via HTTPS (Let's Encrypt / Cloudflare).

## 2. Production Environment
- [ ] `NODE_ENV` set to `production`.
- [ ] Default dummy credentials removed (change default Admin email and password!).
- [ ] JWT and Session Secrets replaced with strong random strings.
- [ ] Firewall configured to block direct database/JSON file access.
- [ ] Rate limiting enabled (configured in `backend/config/index.js`).

## 3. Data & Storage
- [ ] Transition from JSON file-store to a robust database (PostgreSQL/MongoDB) before mass marketing. JSON is only suitable for the initial soft-launch/beta testing phase.
- [ ] Daily automated backups configured for `database/` and `uploads/` directories.

## 4. Monitoring & Analytics
- [ ] Uptime monitoring enabled (e.g., UptimeRobot).
- [ ] Error tracking configured (e.g., Sentry).
- [ ] Basic Google Analytics or PostHog connected for traffic monitoring.

## 5. Operations
- [ ] Support phone number and WhatsApp verified and active.
- [ ] Delivery staff or 3rd-party logistics ready for COD fulfillments.
- [ ] Staff trained on POS and order management workflows.
