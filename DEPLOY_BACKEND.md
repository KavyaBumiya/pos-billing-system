# Deploy Backend to Render - Step by Step Guide

## Quick Setup (5 minutes)

### Step 1: Create Render Account
1. Go to https://render.com
2. Click "Get Started" (it's free)
3. Sign up with GitHub or Email

### Step 2: Deploy Backend
1. Click "New +" button (top right)
2. Select "Web Service"
3. Choose "Deploy from local source" OR connect your GitHub

#### If using Local Source:
1. Click "Public Git repository"
2. Enter: `https://github.com/render-examples/flask-hello-world` (we'll change this)
3. OR use "Deploy without Git" option

#### Recommended: Direct Deploy
1. Click "New +" → "Web Service"
2. Name: `pos-billing-api`
3. Region: Choose closest to India (Singapore or Frankfurt)
4. Branch: main (if using Git)
5. **Root Directory**: `backend`
6. Runtime: `Python 3`
7. **Build Command**: `pip install -r requirements.txt`
8. **Start Command**: `gunicorn --bind 0.0.0.0:$PORT app:app`
9. Plan: **Free** (select this!)
10. Click "Create Web Service"

### Step 3: Wait for Deployment (2-3 minutes)
Render will:
- Build your app
- Install dependencies
- Start the server
- Provide you with a URL like: `https://pos-billing-api-xxxx.onrender.com`

### Step 4: Copy Your Backend URL
Once deployed, copy the URL from Render dashboard.

### Step 5: Run These Commands

```powershell
# Replace with YOUR actual Render URL
$BACKEND_URL = "https://pos-billing-api-xxxx.onrender.com"

# Test backend is alive
Invoke-RestMethod -Uri "$BACKEND_URL/" -Method GET

# Seed the database with all products
Invoke-RestMethod -Uri "$BACKEND_URL/api/seed" -Method POST

# Verify categories loaded
Invoke-RestMethod -Uri "$BACKEND_URL/api/categories" -Method GET

# Verify products loaded
Invoke-RestMethod -Uri "$BACKEND_URL/api/products" -Method GET
```

### Step 6: Redeploy Frontend with Correct URL

```powershell
# Use YOUR Render backend URL
$env:REACT_APP_API_URL='https://pos-billing-api-xxxx.onrender.com/api'
cd frontend
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

---

## Alternative: Manual Upload to Render

If the above doesn't work, I can create a ZIP file for manual upload:

1. Zip only the `backend` folder
2. Upload to Render manually
3. Follow steps above

---

## Troubleshooting

**Backend won't start?**
- Check Render logs in dashboard
- Verify `requirements.txt` has all dependencies
- Make sure `gunicorn` is installed

**Database empty after deploy?**
- Run the seed command: `Invoke-RestMethod -Uri "$BACKEND_URL/api/seed" -Method POST`
- Check Render logs for errors

**Frontend not connecting?**
- Verify API URL in browser console
- Check CORS is enabled in backend (it is in our app.py)
- Make sure backend URL ends with `/api`
