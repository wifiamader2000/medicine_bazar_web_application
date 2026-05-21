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
