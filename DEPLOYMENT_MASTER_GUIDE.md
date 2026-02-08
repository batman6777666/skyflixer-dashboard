# 🚀 Rename Tool - Master Deployment Guide

This guide covers how to deploy the entire Rename Tool application from scratch using your new repository.

**Repository:** `https://github.com/MASTER3389/rename-tools`

---

## 1️⃣ Part 1: Backend Deployment (Render)

The backend is an API server that handles all the logic (renaming, fetching files, stats).

### Steps:
1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `MASTER3389/rename-tools`
4. **Configure Settings:**
   - **Name:** `rename-tool-backend` (or similar)
   - **Root Directory:** `backend` (IMPORTANT!)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Add Environment Variables:**
   Click "Environment" and add the keys below:
   
   ```ini
   # API Keys
   RPMSHARE_API_KEY_1=9296838b93982058f014e66f
   RPMSHARE_API_KEY_2=fff2a1fd688b0b315bff26bd
   
   STREAMP2P_API_KEY_1=e7217c652a08c52db27f079c
   STREAMP2P_API_KEY_2=68f0a04a15ecbb5ff2e7c7b6
   
   SEEKSTREAMING_API_KEY_1=c56c50a698b4ba9cc6792868
   SEEKSTREAMING_API_KEY_2=7e33797d15fe8f99c11b5a91
   
   UPNSHARE_API_KEY_1=37d66092064c658d467cbdd9
   UPNSHARE_API_KEY_2=84810a38c64fc861f593480a
   ```
6. **Deploy!**
   - Once deployed, copy your backend URL (e.g., `https://rename-tool-backend.onrender.com`)

---

## 2️⃣ Part 2: Frontend Deployment (Vercel)

The frontend is the Dashboard UI that you interact with.

### Steps:
1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo: `MASTER3389/rename-tools`
4. **Configure Settings:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click "Edit" and select `frontend` folder
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Add Environment Variable:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://your-render-backend-url.onrender.com/api`
   
   > ⚠️ **CRITICAL:** 
   > - Value must allow `https://`
   > - Value must end with `/api`
   > - Value must NOT have a trailing slash `/` after `api`
   > - Example: `https://rename-tool-backend.onrender.com/api`
   
6. **Deploy!**

---

## 3️⃣ Verify Everything

1. Open your Vercel URL (e.g., `https://rename-tool-dashboard.vercel.app`)
2. The Dashboard should load perfectly.
3. **Data Check:** If you see files listed, the connection to Backend is working!
4. **Stats Check:** If the stats at the top show numbers, the API is responding!

### Troubleshooting
- **"Fetch Failed"?** → Check `VITE_API_URL` in Vercel. Did you add `/api`? Did you remove the trailing slash? Redeploy if you changed it.
- **Blank Screen?** → Check if Root Directory was set to `frontend` on Vercel.

---

**🎉 Your Rename Tool is Ready!**
