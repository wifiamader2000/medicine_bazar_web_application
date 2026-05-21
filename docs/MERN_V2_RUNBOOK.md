# Medicine Bazar MERN V2 Runbook

This guide covers everything needed to run, migrate, and deploy the MERN V2 stack for Medicine Bazar.

## 1. How to start MongoDB

Ensure MongoDB is installed and running on your system.

**Windows:**
```powershell
net start MongoDB
```

**Linux (Ubuntu/Debian):**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

Ensure MongoDB is accessible on `mongodb://127.0.0.1:27017/medicine_bazar` or configure `MONGO_URI` in the `.env` file.

## 2. How to set DB_DRIVER=mongodb

In the backend root directory (`d:\medicine bazar\medicine_bazar_web_application`), create or edit the `.env` file:

```env
DB_DRIVER=mongodb
MONGO_URI=mongodb://127.0.0.1:27017/medicine_bazar
PORT=5050
```

## 3. How to run migration

To migrate the existing JSON file database to MongoDB:

```bash
# Ensure DB_DRIVER=mongodb is set in .env
npm run seed
```
*(This uses `scripts/seed.js` which has been updated to migrate the `database/` JSON files to MongoDB)*

## 4. How to start the backend

From the project root:
```bash
# Starts Express.js on port 5050 (or whatever PORT is configured)
npm run start:api
```

## 5. How to run frontend-react (Local Dev)

From the project root, start the Vite development server:
```bash
npm run dev:react
```
This will start the frontend on `http://localhost:5173` (by default) with hot-module replacement.

Ensure `frontend-react/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5050/api/v1
```

## 6. How to build frontend-react

To build the React application for production:
```bash
npm run build:react
```
The compiled static files will be generated in `frontend-react/dist/`.

## 7. How to deploy React build with Express/Nginx

### Option A: Serve via Nginx (Recommended for Production)

1. Build the React app: `npm run build:react`
2. Configure Nginx to serve `frontend-react/dist` as the web root, and proxy `/api` to the Express backend.

```nginx
server {
    listen 80;
    server_name medicinebazar.com.bd staging.medicinebazar.com.bd;

    # Serve React Frontend
    location / {
        root /var/www/medicine_bazar/frontend-react/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API Requests to Node/Express Backend
    location /api/ {
        proxy_pass http://127.0.0.1:5050/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option B: Serve statically via Express (Optional/Alternative)

If you configure `backend/server.js` to serve static files from `frontend-react/dist/`, simply running `npm run start:api` in production will serve both the API and the React frontend.

---

## 8. Production Database Backups

Regular database backups are critical to prevent data loss. Always run backup operations in the background or during off-peak hours.

### Case A: MongoDB (Recommended Setup)
To perform a full, point-in-time snapshot of your MongoDB production database, use `mongodump`.

**Manual Backup:**
```bash
# Back up to a timestamped folder in the project backups/ directory
mongodump --uri="mongodb://127.0.0.1:27017/medicine_bazar" --out=./backups/mongo-backup-$(date +%F_%H-%M-%S)
```

**Automated Backup Script (Linux/Nginx cron):**
Create a cron job to automatically dump and compress the database daily:
```bash
0 3 * * * tar -czf ./backups/db-backup-$(date +\%F).tar.gz -C ./backups mongodump --uri="mongodb://127.0.0.1:27017/medicine_bazar"
```

**Database Restoration:**
To restore a MongoDB backup:
```bash
mongorestore --uri="mongodb://127.0.0.1:27017/medicine_bazar" --drop ./backups/mongo-backup-YYYY-MM-DD_HH-MM-SS/medicine_bazar
```

---

### Case B: JSON File Fallback Setup
If running the JSON storage engine fallback, you must back up the database JSON files and files inside the secure uploads directory.

**Manual Backup:**
```powershell
# Windows PowerShell
Compress-Archive -Path "database\*", "uploads\*" -DestinationPath "backups\json-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
```
```bash
# Linux Bash
zip -r ./backups/json-backup-$(date +%F_%H-%M-%S).zip ./database/ ./uploads/
```

---

## 9. Production Smoke QA Checklist

After performing a deploy or major upgrade, execute the following smoke tests to verify the core systems are operational:

### 1. Localization & Toggle
- [ ] **Bilingual Toggle**: Click the language switcher in the header (EN / বাংলা). Verify all navigation items, search bars, labels, and footer change immediately.
- [ ] **State Preservation**: Refresh the page after selecting "বাংলা" and ensure the language selection persists across pages and refreshes.

### 2. Search & Fuzzy Matching
- [ ] **Fuzzy Search Overlays**: Type a misspelled name (e.g., "naap" instead of "Napa") in the main search bar. Verify that fuzzy matches appear correctly in the suggestion drop-down and that matching text ranges are bolded.
- [ ] **Analytics Logging**: Enter a completely invalid query. Verify in the backend logs or database that search misses are recorded without failing the UI.

### 3. Generic Alternatives Carousel
- [ ] **Substitutes Rendering**: Open a specific product page (e.g., Napa Extend). Scroll down to the "Alternative Brands / বিকল্প ব্র্যান্ড" section.
- [ ] **Verification**: Verify that alternatives have the same `genericName`, are sorted by stock and lowest price, show real savings calculations, and allow adding straight to the cart.

### 4. Safe Prescription Workflow
- [ ] **Customer Upload**: Navigate to checkout or the prescription upload form. Fill out the Patient Name, Doctor Name, Note, and upload a dummy PDF or image.
- [ ] **Timeline & WhatsApp Link**: After uploading, verify you see a success timeline indicating "Pending Review / পর্যালোচনাধীন" and a green "Chat with Pharmacist" button linking to the verified WhatsApp hotline.
- [ ] **Pharmacist Audit Desk**: Log in as an Administrator/Pharmacist, navigate to the Prescription Queue, verify the file link is accessible only under authentication, view the audit log entry, and attempt to approve or reject the prescription safely.

### 5. Cashier POS Terminal
- [ ] **Hotkey Interrupts**: Load the POS page. Press `F2` to focus the search bar, `F8` to focus the phone input, and `Esc` to clear modals or active actions.
- [ ] **Hold/Recall Cart**: Add item to cart, click "Hold Cart" (or hold shortcut). Change active cart index, add new items, and verify you can switch back to the original cart seamlessly with no lost items or corrupted stock states.

### 6. ERP Analytics Verification
- [ ] **Live Dashboards**: Open the ERP dashboard, check that the daily earnings charts render correctly, inventory alarm zones display low-stock warning limits, and expiring items are categorized correctly (within 30, 60, and 90 days) based on real database records.
