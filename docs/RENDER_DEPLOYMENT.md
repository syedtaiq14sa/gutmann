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

- `DATABASE_URL`: URL for your database.
- `API_KEY`: Your API key for external services.

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

- `REACT_APP_API_URL`: The base URL for your backend API.

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
