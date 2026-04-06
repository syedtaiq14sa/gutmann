# Render.com Complete Deployment Guide

This guide walks you through deploying both the Gutmann backend and frontend to [Render.com](https://render.com).

---

## Prerequisites

- A Render.com account (free tier is sufficient to start)
- Supabase project set up and credentials available (see `docs/SUPABASE_COMPLETE_SETUP.md`)
- The repository pushed to GitHub at `syedtaiq14sa/gutmann`

---

## Step 1: Create a Render Account & Connect GitHub

1. Go to [https://render.com](https://render.com) and click **Get Started for Free**.
2. Sign up using your **GitHub** account (recommended – Render will automatically have access to your repositories).
3. If prompted, authorize Render to access your GitHub organizations and repositories.

---

## Step 2: Deploy Using `render.yaml` (Recommended – One Click)

This repository contains a `render.yaml` Blueprint at the root. Render can read this file and create all services automatically.

1. In the Render dashboard click **New → Blueprint**.
2. Select the `syedtaiq14sa/gutmann` repository and the `main` branch.
3. Render will detect `render.yaml` and display the services it will create.
4. Review the services, then click **Apply**.
5. You will be prompted to enter the required environment variables (see Step 4 below).

---

## Step 3: Manual Setup (Alternative)

If you prefer to create each service by hand, follow these sub-steps.

### 3a – Backend Web Service

1. Click **New → Web Service**.
2. Connect the `syedtaiq14sa/gutmann` repository.
3. Set the following options:

| Setting | Value |
|---|---|
| **Name** | `gutmann-backend` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or Starter for always-on) |

4. Click **Create Web Service**.

### 3b – Frontend Static Site

1. Click **New → Static Site**.
2. Connect the same `syedtaiq14sa/gutmann` repository.
3. Set the following options:

| Setting | Value |
|---|---|
| **Name** | `gutmann-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

4. Click **Create Static Site**.

---

## Step 4: Set Environment Variables

### Backend Environment Variables

In the Render dashboard, navigate to your **gutmann-backend** service → **Environment** tab, then add:

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJ...` (anon/public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role key) |
| `DATABASE_URL` | `postgresql://postgres:<password>@db.xxxxxxxxxxxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | Generate with: `openssl rand -hex 32` |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `SENDGRID_API_KEY` | *(optional)* your SendGrid API key for email notifications |

### Frontend Environment Variables

In the Render dashboard, navigate to your **gutmann-frontend** static site → **Environment** tab, then add:

| Key | Value |
|---|---|
| `REACT_APP_API_URL` | `https://gutmann-backend.onrender.com/api` |
| `REACT_APP_SOCKET_URL` | `https://gutmann-backend.onrender.com` |
| `REACT_APP_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJ...` (anon/public key) |

> ⚠️ **Critical – Build-Time Variables**: Create React App (CRA) bakes `REACT_APP_*` variables into the JavaScript bundle **at build time**, not at runtime. This means:
> - You **must** set all four variables above in the Render dashboard **before** triggering a build.
> - If you forget to set them (or add/change them later), you **must** trigger a manual redeploy so the new build picks them up.
> - If `REACT_APP_API_URL` is missing at build time the app will have no backend URL and every API call will fail with a network error. The browser console will show an error like `[api] REACT_APP_API_URL is not set`.

**How to trigger a manual redeploy after adding/changing env vars:**
1. Open your **gutmann-frontend** static site in the Render dashboard.
2. Click **Manual Deploy** → **Deploy latest commit**.

---

## Step 5: Deploy

1. After saving environment variables, click **Manual Deploy → Deploy latest commit** (or wait for the automatic deploy to trigger).
2. Watch the build logs in the **Logs** tab.
3. Backend build takes approximately **2–5 minutes**.
4. Frontend build takes approximately **3–7 minutes**.
5. When deployment succeeds you will see **"Live"** status in the dashboard.

### Expected Service URLs

| Service | URL |
|---|---|
| Backend API | `https://gutmann-backend.onrender.com` |
| Frontend App | `https://gutmann-frontend.onrender.com` |

> Actual subdomain may differ slightly if the name is already taken on Render.

---

## Step 6: Verify the Deployment

Run a quick health check on the backend:

```bash
curl https://gutmann-backend.onrender.com/api/health
# Expected: {"status":"ok"}
```

Then open the frontend URL in your browser and log in with a test account (see `docs/TESTING_GUIDE.md`).

---

## Troubleshooting Render Deployment

| Problem | Solution |
|---|---|
| Build fails with `Cannot find module` | Confirm **Root Directory** is set to `backend` or `frontend` respectively |
| Backend crashes on start | Check **Logs** tab – most likely a missing environment variable |
| Frontend shows blank page | Open browser DevTools console; usually `REACT_APP_API_URL` is wrong |
| **Login fails / API calls go to `localhost:3001`** | `REACT_APP_API_URL` was not set before the build. Add it in Render → **gutmann-frontend** → **Environment**, then trigger **Manual Deploy → Deploy latest commit** |
| Free tier service sleeps | The Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 s. Upgrade to Starter ($7/mo) for always-on |
| CORS errors in browser | Ensure `REACT_APP_API_URL` in frontend matches the exact backend URL (no trailing slash) |
| `openssl rand -hex 32` unavailable on Windows | Use this alternative: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
