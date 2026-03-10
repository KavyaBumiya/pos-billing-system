# Bumiya Milk Suppliers — POS Billing System

A full-featured Windows POS Billing System built with **React + Python Flask + SQLite**.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend UI | React 18 |
| Desktop App | Electron 27 |
| Backend API | Python Flask |
| Database | SQLite (local) |
| Printer | Windows Printer / ESC-POS |

---

## Quick Start

### 1. Install Dependencies
Double-click **`install.bat`** or run:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Run the App
Double-click **`start.bat`** or:
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm start
```

Open http://localhost:3000 in your browser.

---

## Firebase Hosting Deployment (Frontend)

This project is configured to deploy the React app from `frontend/build` to Firebase Hosting.

### 1. Build and Deploy
From project root:

```bash
npm run deploy:firebase
```

This runs:
- `npm run build:web` (creates production build)
- `npx firebase-tools deploy --only hosting` (publishes to Firebase)

### 2. Live URL
- https://pos-billing-software-5a3c0.web.app

### 3. API Configuration Note
The frontend currently defaults to `http://localhost:5000/api` when `REACT_APP_API_URL` is not set. For production use, point it to a hosted backend API URL.

---

## Host Flask Backend (Multiple Options)

Backend is now cloud-ready with:
- `backend/requirements.txt` (Linux-safe dependencies)
- `backend/Procfile`
- `backend/Dockerfile`
- `backend/render.yaml`
- `backend/railway.json`

### Option 1: Render (Free Tier Available - Recommended)

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your Git repository or use "Deploy from local"
4. Set:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT app:app`
5. Click "Create Web Service"
6. After deploy, note the URL: `https://pos-billing-api.onrender.com`

Your production API base: `https://pos-billing-api.onrender.com/api`

### Option 2: Railway (Free Trial Available)

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect repository and set root directory to `backend`
4. Railway auto-detects Python and uses `railway.json` config
5. After deploy, note the URL from Railway dashboard

### Option 3: Google Cloud Run (Requires Billing)

**Prerequisites**: [Enable billing](https://console.cloud.google.com/billing/linkedaccount?project=pos-billing-software-5a3c0) in Google Cloud Console

```bash
gcloud auth login
gcloud config set project pos-billing-software-5a3c0
npm run deploy:backend:cloudrun
```

After deploy, note the service URL (example):
- `https://pos-billing-api-xxxxx-uc.a.run.app`

Your production API base should be:
- `https://pos-billing-api-xxxxx-uc.a.run.app/api`

### Deploy Frontend with Production API URL

Once your backend is deployed (using Render, Railway, or Cloud Run), deploy the frontend:

**PowerShell (Windows):**
```powershell
# Set API URL and build
$env:REACT_APP_API_URL='https://YOUR-BACKEND-URL/api'
cd frontend
npm run build

# Deploy to production
cd ..
npx firebase-tools deploy --only hosting

# Deploy preview channel (optional)
npx firebase-tools hosting:channel:deploy preview --expires 7d

# Deploy QA channel (optional)
npx firebase-tools hosting:channel:deploy qa --expires 14d
```

**Example with Render:**
```powershell
$env:REACT_APP_API_URL='https://pos-billing-api.onrender.com/api'
cd frontend
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

## Firebase Preview Channels (Pre-release)

Use preview channels to test safely before shipping to live site.

### Preview (7 days)
```bash
npm run deploy:preview --apiurl=https://YOUR-BACKEND-URL/api
```

### QA Channel (14 days)
```bash
npm run deploy:preview:qa --apiurl=https://YOUR-BACKEND-URL/api
```

Firebase CLI prints unique preview URLs after deployment.

---

## Features

### 🧾 Billing
- Category-based quick-add product buttons
- Barcode / name search
- Weight & quantity billing (kg, litre, piece, etc.)
- Per-item tax calculation
- Discount on total
- Cash change calculator
- Bill number auto-increment (prefix configurable)
- Save & print bill receipt

### 📦 Products
- Add/Edit/Deactivate products
- Assign category, unit, price, tax%, HSN code, barcode
- Bulk price update (fixed, % increase/decrease, amount change)
- Price & tax audit log

### 🗂️ Categories
- Add/Edit/Delete categories
- Milk, Paneer, Butter, Ghee, Curd pre-seeded

### 📊 Dashboard
- Today's sales total & bill count
- Monthly totals
- Top-selling products today

### 📋 Bill History
- Filter by date range
- View full bill details
- Print from history
- Cancel bills

### ⚙️ Settings
- Shop name, address, phone, GSTIN
- Bill prefix & counter
- Tax mode (inclusive/exclusive)
- Show/hide tax on receipt
- Footer message
- Printer selection (Windows printers auto-detected)
- Print copies

---

## Project Structure
```
POS-BILLING-SYSTEM/
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── requirements.txt
│   ├── models/
│   │   └── database.py     # SQLite init & schema
│   └── routes/
│       ├── categories.py
│       ├── products.py
│       ├── billing.py
│       └── settings.py
├── frontend/
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   └── electron.js     # Electron main process
│   └── src/
│       ├── index.js
│       ├── services/
│       │   └── api.js      # Axios API client
│       ├── styles/
│       │   └── index.css
│       └── components/
│           ├── App.js
│           ├── billing/
│           │   ├── BillingPage.js
│           │   ├── BillReceipt.js
│           │   └── BillsHistoryPage.js
│           ├── products/
│           │   └── ProductsPage.js
│           ├── categories/
│           │   └── CategoriesPage.js
│           ├── settings/
│           │   └── SettingsPage.js
│           └── common/
│               └── DashboardPage.js
├── install.bat
├── start.bat
└── README.md
```

---

## Database (SQLite — `backend/pos_data.db`)
- **categories** — product categories
- **products** — items with price, unit, tax
- **bills** — bill headers
- **bill_items** — line items per bill
- **settings** — key-value app settings
- **price_audit_log** — all price/tax changes

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PUT | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |
| GET | /api/products | List products |
| GET | /api/products/search?q= | Search products |
| POST | /api/products | Create product |
| PUT | /api/products/:id | Update product |
| POST | /api/products/bulk-update | Bulk price update |
| GET | /api/products/audit-log | Price change log |
| GET | /api/bills | List bills |
| POST | /api/bills | Create bill |
| GET | /api/bills/:id | Get bill detail |
| GET | /api/bills/summary | Today/month summary |
| GET | /api/settings | Get all settings |
| POST | /api/settings | Update settings |
| GET | /api/printers | List Windows printers |
| POST | /api/print-bill | Send to printer |
