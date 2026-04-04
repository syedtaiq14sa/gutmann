# Supabase Complete Setup Guide

This guide walks you through creating and configuring a Supabase project for the Gutmann Workflow Management System.

---

## Step 1: Create a Supabase Project

1. Open [https://supabase.com](https://supabase.com) in your browser.
2. Click **Start your project** and sign up (GitHub sign-in is recommended).
3. Once logged in, click **New Project**.
4. Fill in the project details:
   - **Organization**: select or create one
   - **Project name**: `gutmann`
   - **Database password**: choose a strong password and **save it** – you will need it later
   - **Region**: choose the region closest to your users
5. Click **Create new project** and wait 2–3 minutes for provisioning to finish.

---

## Step 2: Retrieve Credentials

1. In the Supabase dashboard, open your `gutmann` project.
2. Go to **Settings → API** in the left sidebar.
3. Copy the following three values and keep them safe:

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | **Project URL** field (e.g. `https://xxxxxxxxxxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | **anon / public** key under *Project API keys* |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role / secret** key under *Project API keys* |

> **Security note**: The service role key bypasses Row Level Security. Never expose it in frontend code or commit it to source control.

---

## Step 3: Run the Database Schema

1. In the left sidebar click **SQL Editor → New query**.
2. Open `database/migrations/001_initial_schema.sql` from this repository.
3. Paste the entire file content into the query editor.
4. Click **Run ▶** (or press `Ctrl+Enter` / `Cmd+Enter`).
5. You should see **"Success. No rows returned"** – this means all tables were created successfully.

The migration creates the following tables:
- `users`
- `inquiries`
- `qc_reviews`
- `technical_reviews`
- `quotations`
- `project_status`
- `workflow_transitions`
- `notifications`
- `audit_log`
- `comments`

---

## Step 4: Seed Test Users

1. In the **SQL Editor**, create another **New query**.
2. Open `database/seeds/test_users.sql` from this repository.
3. Paste the entire file content and click **Run ▶**.
4. You will have one test user for each role (see table below).

| Email | Password | Role |
|---|---|---|
| `ceo@gutmann.com` | `Admin@123` | CEO |
| `sales@gutmann.com` | `Sales@123` | Salesperson |
| `qc@gutmann.com` | `QC@12345` | QC |
| `tech@gutmann.com` | `Tech@123` | Technical |
| `estimation@gutmann.com` | `Est@1234` | Estimation |
| `client@gutmann.com` | `Client@12` | Client |

> These are **development/testing** credentials. Change all passwords before going to production.

---

## Step 5: (Optional) Enable Row Level Security

The schema does not enable RLS by default so that the backend service role can manage all rows freely. If you want to add RLS policies later:

1. Go to **Authentication → Policies** in the Supabase dashboard.
2. Enable RLS on each table.
3. Add policies that allow the service role full access and restrict anon access as needed.

---

## Step 6: Configure the Backend `.env`

Copy the credentials you retrieved in Step 2 into the backend environment file:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:<DB_PASSWORD>@db.xxxxxxxxxxxx.supabase.co:5432/postgres
JWT_SECRET=<run: openssl rand -hex 32>
PORT=3001
NODE_ENV=development
```

Copy the credentials into the frontend environment file as well:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Troubleshooting Supabase Setup

| Problem | Solution |
|---|---|
| Project stuck on "Setting up" | Refresh the page; provisioning can take up to 5 minutes |
| SQL schema errors on `CREATE EXTENSION` | Enable the `uuid-ossp` extension manually under **Database → Extensions** |
| "duplicate key value" on seed insert | The row already exists; safe to ignore or run `DELETE FROM users WHERE email = '...'` first |
| Can't find service role key | Go to **Settings → API** and reveal the `service_role` key |
| Project paused (free tier) | Open the Supabase dashboard and click **Restore project** |
