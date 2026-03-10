# POS Billing System - Deployment Info

## Live URLs

### Production
- **Frontend**: https://pos-billing-software-5a3c0.web.app
- **Backend API**: https://pos-billing-api.onrender.com/api

### Preview Channels

#### Preview (Expires: March 17, 2026)
- https://pos-billing-software-5a3c0--preview-bnzxxh3e.web.app

#### QA (Expires: March 24, 2026)
- https://pos-billing-software-5a3c0--qa-8dty7kbs.web.app

---

## Deployment Status

✅ **Firebase Hosting** - All channels deployed
✅ **Backend API** - Connected to Render
✅ **Production Build** - Using Render API URL
✅ **Preview Channels** - Ready for testing
✅ **Security** - No `.env` or `venv` files in deployment

---

## Quick Redeploy Commands

### Update Production
```powershell
$env:REACT_APP_API_URL='https://pos-billing-api.onrender.com/api'
cd frontend
npm run build
cd ..
npx firebase-tools deploy --only hosting
```

### Update Preview Channel
```powershell
npx firebase-tools hosting:channel:deploy preview --expires 7d
```

### Update QA Channel
```powershell
npx firebase-tools hosting:channel:deploy qa --expires 14d
```

---

## Backend Deployment (Render)

⚠️ **IMPORTANT**: Backend must be deployed separately!

### Quick Deploy:
1. **Upload**: Use [backend-deploy.zip](backend-deploy.zip) 
2. **Platform**: https://render.com (free tier)
3. **Settings**:
   - Runtime: Python 3
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn --bind 0.0.0.0:$PORT app:app`

### After Deploy:
Run this script with your Render URL:
```powershell
.\setup-backend.ps1 -BackendUrl "https://YOUR-APP.onrender.com"
```

This will:
- Test backend connection
- Seed all 55 products & 11 categories
- Verify data loaded
- Show commands to update frontend

Full guide: [DEPLOY_BACKEND.md](DEPLOY_BACKEND.md)

---

## Firebase Configuration

Project: `pos-billing-software-5a3c0`
- Hosting: Enabled
- Analytics: Enabled (with safe initialization)

Preview channels are ephemeral URLs for testing before production release.

---

**Last Updated**: March 10, 2026
