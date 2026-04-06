# Supabase Setup Guide

## Prerequisites
- A Supabase account at https://supabase.com
- Your GUTMANN project repository

---

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click **New Project**
3. Enter:
   - **Name**: `gutmann-production`
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click **Create new project** and wait ~2 minutes

---

## Step 2: Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Open `database/migrations/001_initial_schema.sql`
3. Copy and paste the entire content into the SQL Editor
4. Click **Run**
5. Verify tables are created in **Table Editor**

---

## Step 3: Load Test Data (Optional)

> **Important:** The `users` table stores passwords as bcrypt hashes in the `password_hash`
> column. Never insert plaintext passwords. The seed file already contains pre-generated
> bcrypt hashes for the default test password `Test@1234`.

1. In the SQL Editor, run `database/seeds/test_users.sql`  
   (The file already contains bcrypt-hashed passwords matching the backend — see [CREATE_TEST_USERS.md](CREATE_TEST_USERS.md) for details and instructions on generating hashes for custom passwords.)
2. Then run `database/seeds/sample_inquiries.sql`
3. Verify data appears in Table Editor

### Creating additional test users via the API (recommended)

Use the `/api/auth/register` endpoint so the backend hashes the password automatically:

```bash
BACKEND_URL="https://YOUR-BACKEND.onrender.com"

curl -sS -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"CEO Admin","email":"ceo@gutmann.com","password":"Admin@12345","role":"ceo"}'
```

### Creating test users via Supabase SQL Editor

If you need to insert users directly via SQL, you must supply a bcrypt hash for `password_hash`.

**Step 1 – Generate a hash** (from the repo root, requires `bcryptjs` installed in `backend/`):

```bash
cd backend && npm install   # if not already installed
node ../scripts/generate_bcrypt_hash.js "MyPassword@1"
# outputs: $2a$12$...
```

**Step 2 – Use the hash in your INSERT:**

```sql
INSERT INTO public.users (email, password_hash, name, role, is_active)
VALUES (
  'newuser@example.com',
  '$2a$12$<paste-hash-here>',
  'New User',
  'salesperson',  -- ceo | salesperson | qc | technical | estimation | client
  true
);
```

> ⚠️ Do **not** use the `password` column — it does not exist. The correct column is `password_hash`.

---

## Step 4: Get Your API Keys

1. Go to **Settings → API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

---

## Step 5: Configure Row Level Security (RLS)

The schema already includes RLS policies. To verify:

1. Go to **Authentication → Policies**
2. Confirm policies exist for each table
3. Enable RLS on all tables if not already enabled

---

## Step 6: Configure Environment Variables

### Backend `.env`
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secure-random-string
JWT_EXPIRY=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SOCKET_URL=http://localhost:3001
```

---

## Step 7: Test Connection

```bash
cd backend
npm install
npm run dev
# Should see: GUTMANN Backend running on port 3001

# Test health endpoint:
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Invalid API key` | Double-check SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY |
| `relation does not exist` | Re-run the migration SQL |
| `column "password" does not exist` | Use `password_hash` column; see Step 3 above |
| `RLS policy violation` | Check that service_role key is used in backend |
| `CORS error` | Set FRONTEND_URL correctly in backend .env |
