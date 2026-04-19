# Deployment Instructions for Render.com

## Overview

This document provides the instructions for deploying both the backend and frontend applications to Render.com. It includes environment variable configurations and a guide for setting up GitHub Actions for automated deployment.

## Prerequisites

- An account on Render.com
- Access to the GitHub repository
- GitHub Actions enabled in your repository

## Deploying the Backend

### Step 1: Create a New Web Service on Render

1. Log in to your Render.com account.
2. Click on the **New** button and select **Web Service**.
3. Connect your GitHub account and select the backend repository.
4. Set the environment to your desired branch (e.g., `main`).

### Step 2: Configure Environment Variables

Add the following environment variables in the Render dashboard under the **Environment** section:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | `https://ewjbhcqnkbuxbvstdbnc.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3amJoY3Fua2J1eGJ2c3RkYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk4MzMsImV4cCI6MjA5MDg1NTgzM30.8Sc3uPYNg8NGcn_Qwc5pCs1TIM_mdDnXx8KwuO3ajgo` |
| `SUPABASE_SERVICE_ROLE_KEY` | Retrieve from **Supabase → Project Settings → API → service_role** |
| `DATABASE_URL` | `postgresql://postgres:[YOUR-PASSWORD]@db.ewjbhcqnkbuxbvstdbnc.supabase.co:5432/postgres` |
| `JWT_SECRET` | Generate a strong random string (e.g., `openssl rand -hex 32`) |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your Render frontend URL (e.g., `https://gutmann-frontend.onrender.com`) |

**How to add variables in Render:**
1. Open your Web Service in the Render dashboard.
2. Click **Environment** in the left sidebar.
3. Click **Add Environment Variable** for each row above.
4. Enter the exact variable name and value, then click **Save Changes**.
5. Render will automatically redeploy the service with the new variables.

### Step 3: Build Command

Set the build command to:

```bash
npm install
```

### Step 4: Start Command

Set the start command to:

```bash
npm start
```

## Deploying the Frontend

### Step 1: Create a New Static Site on Render

1. Click on the **New** button and select **Static Site**.
2. Connect your GitHub account and select the frontend repository.
3. Set the environment to your desired branch (e.g., `main`).

### Step 2: Configure Environment Variables

Add any necessary environment variables for the frontend:

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | Your Render backend URL + `/api` (e.g., `https://gutmann-backend.onrender.com/api`) |
| `REACT_APP_SOCKET_URL` | Your Render backend URL (e.g., `https://gutmann-backend.onrender.com`) |
| `REACT_APP_SUPABASE_URL` | `https://ewjbhcqnkbuxbvstdbnc.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3amJoY3Fua2J1eGJ2c3RkYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk4MzMsImV4cCI6MjA5MDg1NTgzM30.8Sc3uPYNg8NGcn_Qwc5pCs1TIM_mdDnXx8KwuO3ajgo` |

> ⚠️ **Critical**: These variables are baked into the React build at **build time** by Create React App. You **must** set them in the Render dashboard **before** triggering a build. If they are missing, the app will have no backend URL and all API/Socket calls will fail. After updating env vars, always trigger a **Manual Deploy** to rebuild.

**How to add variables in Render:**
1. Open your Static Site in the Render dashboard.
2. Click **Environment** in the left sidebar.
3. Click **Add Environment Variable** for each row above.
4. Enter the exact variable name and value, then click **Save Changes**.
5. Render will automatically rebuild the site with the new variables.

### Step 3: Build Command

Set the build command to:

```bash
npm run build
```

### Step 4: Publish Directory

Set the publish directory to:

```
build
```

## GitHub Actions Setup

To automate deployments, add a GitHub Actions workflow in your repository:

1. Create a directory named `.github/workflows` in your repository.
2. Inside the workflows directory, create a file named `deploy.yml`.

### Example `deploy.yml`

```yaml
name: Deploy to Render

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/deploy/svc_your_service_id \
          -H 'Authorization: Bearer YOUR_RENDER_API_KEY'
```

Replace `svc_your_service_id` and `YOUR_RENDER_API_KEY` with your service ID and API key.

## Conclusion

Follow these instructions to successfully deploy your applications to Render.com. Ensure you keep your environment variables secure and do not hard-code sensitive information.
