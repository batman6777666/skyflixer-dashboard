# Dashboard Frontend Deployment (Vercel)

Now that your backend is on Render, let's deploy the **Dashboard (Frontend)** to Vercel.

## 🚀 Step 1: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/) and Sign Up/Login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `MASTER3389/rename-tool-for-website`
4. **Configure Project:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend` (Click "Edit" and select the `frontend` folder)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

## 🔗 Step 2: Connect to Backend

In the **Environment Variables** section (before clicking Deploy), add this variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://rename-tool-for-skyflixer.onrender.com/api` |

> ⚠️ **IMPORTANT:** Do NOT include a trailing slash `/` at the end of the URL.
> Correct: `.../api`
> Incorrect: `.../api/`

## 🎉 Step 3: Deploy

1. Click **"Deploy"**
2. Wait ~1 minute for build to complete
3. You will get a URL like `https://rename-tool-dashboard.vercel.app`

## ✨ Done!

Your dashboard is now live and connected to your Render backend!
- Open the Vercel URL
- It should load your dashboard
- "Fetch All Files" should work (via Render backend)
- Stats should load (via Render backend)

---

## 🔧 Troubleshooting

**If fetch fails:**
- Check if your Vercel URL starts with `https://` (it must be HTTPS)
- Check if you added the environment variable `VITE_API_URL` correctly
- Check browser console (F12) for CORS errors

**If blank screen:**
- Ensure "Root Directory" was set to `frontend` during deployment setup
