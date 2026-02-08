# Render Deployment Guide - Multi-Platform Rename Tool

## ✅ Backend Structure (Ready for Render)

Your backend is correctly structured:

```
backend/
├── server.js          # ✅ Entry point using process.env.PORT
├── package.json       # ✅ Has "start": "node server.js"
├── package-lock.json  # ✅ Dependency lock file
├── routes/            # ✅ API routes
├── services/          # ✅ Business logic
├── database/          # ✅ Database setup
└── api/               # ✅ Platform API clients
```

## 🚀 Deploying to Render

### Step 1: Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `MASTER3389/rename-tool-for-website`

### Step 2: Configure Service

**Basic Settings:**
- **Name:** `rename-tool-backend` (or your preferred name)
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main`

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 3: Add Environment Variables

Click **"Environment"** and add these variables:

```
PORT=5000

RPMSHARE_API_KEY_1=your_key_here
RPMSHARE_API_KEY_2=your_key_here

STREAMP2P_API_KEY_1=your_key_here
STREAMP2P_API_KEY_2=your_key_here

SEEKSTREAMING_API_KEY_1=your_key_here
SEEKSTREAMING_API_KEY_2=your_key_here

UPNSHARE_API_KEY_1=your_key_here
UPNSHARE_API_KEY_2=your_key_here
```

> ⚠️ **IMPORTANT:** Use your actual API keys from your local `.env` file

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. You'll get a URL like: `https://rename-tool-backend.onrender.com`

### Step 5: Test Backend

Test the health endpoint:
```bash
curl https://your-render-url.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-08T..."
}
```

## 🔧 Configuration Notes

### Auto-Deploy
- Render auto-deploys on every `git push` to `main` branch
- To disable: Go to Settings → Auto-Deploy → Turn off

### Free Tier Limitations
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month free

### Upgrade to Paid (if needed)
- No sleep time
- Faster response
- More memory/CPU

## 🌐 Connecting Frontend

After backend is deployed, update your frontend:

**In `frontend/src/config.js`** (or wherever API URL is configured):
```javascript
const API_URL = 'https://your-render-url.onrender.com/api';
```

## 🔍 Monitoring

**View Logs:**
1. Go to Render Dashboard
2. Select your service
3. Click **"Logs"** tab
4. Monitor requests and errors in real-time

**Endpoints to test:**
- `GET /health` - Health check
- `GET /api/fetch-files` - Fetch files from platforms
- `GET /api/stats` - Statistics
- `POST /api/rename-batch` - Rename files

---

## 📝 Environment Variables Reference

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (Render sets automatically, but you can override) |
| `RPMSHARE_API_KEY_1` | RPMShare API key (primary) |
| `RPMSHARE_API_KEY_2` | RPMShare API key (rotation) |
| `STREAMP2P_API_KEY_1` | StreamP2P API key (primary) |
| `STREAMP2P_API_KEY_2` | StreamP2P API key (rotation) |
| `SEEKSTREAMING_API_KEY_1` | SeekStreaming API key (primary) |
| `SEEKSTREAMING_API_KEY_2` | SeekStreaming API key (rotation) |
| `UPNSHARE_API_KEY_1` | UPnShare API key (primary) |
| `UPNSHARE_API_KEY_2` | UPnShare API key (rotation) |

---

## ✅ Checklist

- [x] Backend structure correct (`backend/` directory)
- [x] `server.js` uses `process.env.PORT`
- [x] `package.json` has `start` script
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Configure Root Directory as `backend`
- [ ] Add all environment variables
- [ ] Deploy and test `/health` endpoint
- [ ] Update frontend with new backend URL
- [ ] Test file fetching and renaming

---

**Need Help?** 
- [Render Documentation](https://render.com/docs)
- [Render Node.js Guide](https://render.com/docs/deploy-node-express-app)
