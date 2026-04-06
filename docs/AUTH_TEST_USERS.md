# AUTH_TEST_USERS.md — Creating & Logging In with Test Users

This guide explains everything needed to create test users in Supabase and log
in to the Gutmann application, without needing any local development environment.
All steps work in **GitHub Codespaces** or the **Render shell**.

---

## Table of Contents

1. [How Authentication Works](#1-how-authentication-works)
2. [Login Endpoint Reference](#2-login-endpoint-reference)
3. [Method A — Register via API (simplest)](#3-method-a--register-via-api-simplest)
4. [Method B — Direct SQL Insert with bcrypt hashes](#4-method-b--direct-sql-insert-with-bcrypt-hashes)
   - [Step 1: Generate bcrypt hashes](#step-1-generate-bcrypt-hashes)
   - [Step 2: Run the SQL in Supabase](#step-2-run-the-sql-in-supabase)
5. [Example Test-User Credentials](#5-example-test-user-credentials)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. How Authentication Works

| Aspect | Detail |
|--------|--------|
| Hashing library | `bcryptjs` (Node.js) |
| Salt rounds | **12** |
| Token type | JWT (default expiry 7 days) |
| Column in DB | `public.users.password_hash` — stores the bcrypt hash |
| Login flow | Backend fetches user by email, runs `bcrypt.compare(plain, hash)`, returns JWT |
| Register flow | Backend runs `bcrypt.hash(password, 12)`, inserts row in `public.users` |

**Never store plain-text passwords** in `password_hash` — the backend will
reject the login even if the value looks correct.

---

## 2. Login Endpoint Reference

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "ceo@gutmann.com",
  "password": "Admin@12345"
}
```

**Successful response (200):**
```json
{
  "user": { "id": "...", "email": "ceo@gutmann.com", "name": "CEO Admin", "role": "ceo" },
  "token": "<JWT>"
}
```

**Common error codes:**
| Code | Meaning |
|------|---------|
| 400 | Missing `email` or `password` field |
| 401 | Wrong email or wrong password (hash mismatch) |
| 403 | Account exists but `is_active = false` |
| 429 | Rate-limited (20 requests / 15 min per IP) |

Use the returned `token` as a Bearer token in subsequent requests:
```
Authorization: Bearer <JWT>
```

---

## 3. Method A — Register via API (simplest)

The `/api/auth/register` endpoint is **enabled in production**.
Use it to create users without touching the database directly.

### Valid roles

`ceo` | `salesperson` | `qc` | `technical` | `estimation` | `client`

### Using curl (GitHub Codespaces terminal or Render shell)

```bash
BACKEND_URL="https://YOUR-BACKEND.onrender.com"

curl -sS -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"CEO Admin","email":"ceo@gutmann.com","password":"Admin@12345","role":"ceo"}'

curl -sS -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sales User","email":"sales@gutmann.com","password":"Sales@12345","role":"salesperson"}'

curl -sS -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"QC User","email":"qc@gutmann.com","password":"Qc@12345","role":"qc"}'

curl -sS -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Technical User","email":"technical@gutmann.com","password":"Tech@12345","role":"technical"}'

curl -sS -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Estimation User","email":"estimation@gutmann.com","password":"Est@12345","role":"estimation"}'
```

Each successful call returns a `201` response with the user object and a JWT.
If you get `409 Email already registered`, the user already exists — skip to
[login](#2-login-endpoint-reference).

---

## 4. Method B — Direct SQL Insert with bcrypt hashes

Use this method when the API register endpoint is unavailable or you want to
insert users directly into the Supabase database.

### Step 1: Generate bcrypt hashes

Run the helper script **`scripts/generate_password_hash.py`** from a terminal
that has Python 3 available.  No local clone needed — GitHub Codespaces works
perfectly.

#### Option 1 — GitHub Codespaces (browser-based, zero install)

1. Open your repository on GitHub.
2. Click **Code → Codespaces → Create codespace on main**.
3. Wait for the VS Code browser environment to load.
4. Open the terminal (`Ctrl+\`` or Terminal → New Terminal).
5. Run:

```bash
pip install bcrypt
python scripts/generate_password_hash.py
```

The script prints the hashes **and** a complete ready-to-run SQL block.

#### Option 2 — Render shell

1. Open [Render Dashboard](https://dashboard.render.com).
2. Navigate to your backend service → **Shell** tab.
3. Run:

```bash
pip install bcrypt
python scripts/generate_password_hash.py
```

#### Option 3 — Hash a single custom password

```bash
python scripts/generate_password_hash.py "MyCustomPassword@99"
```

#### Option 4 — Node one-liner (if Python is unavailable)

```bash
# In any terminal that has Node.js and bcryptjs installed:
node -e "
const b=require('bcryptjs');
(async()=>{
  const passwords=['Admin@12345','Sales@12345','Qc@12345','Tech@12345','Est@12345'];
  for(const p of passwords) console.log(p, '=>', await b.hash(p,12));
})()"
```

---

### Step 2: Run the SQL in Supabase

1. Copy the SQL output printed by the script (the block between the `===` lines).
2. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
3. Go to **SQL Editor → New query**.
4. Paste the SQL and click **Run**.

The SQL uses `WHERE NOT EXISTS` guards, so it is safe to run multiple times —
duplicate rows will not be inserted.

**Manual SQL template** (if you want to provide your own hashes):

```sql
create extension if not exists pgcrypto;

insert into public.users
  (id, email, password_hash, name, role, is_active, created_at, updated_at)
select
  gen_random_uuid(),
  'ceo@gutmann.com',
  '$2a$12$REPLACE_WITH_ACTUAL_BCRYPT_HASH',
  'CEO Admin',
  'ceo',
  true,
  now(),
  now()
where not exists (select 1 from public.users where email = 'ceo@gutmann.com');

-- Verify
select email, name, role, is_active, created_at
from public.users
order by created_at desc
limit 10;
```

---

## 5. Example Test-User Credentials

These are the default users seeded by `scripts/generate_password_hash.py`
and by `npm run seed` (backend seed script).

| Email | Password | Role | Name |
|-------|----------|------|------|
| `ceo@gutmann.com` | `Admin@12345` | `ceo` | CEO Admin |
| `sales@gutmann.com` | `Sales@12345` | `salesperson` | Sales User |
| `qc@gutmann.com` | `Qc@12345` | `qc` | QC User |
| `technical@gutmann.com` | `Tech@12345` | `technical` | Technical User |
| `estimation@gutmann.com` | `Est@12345` | `estimation` | Estimation User |

> **Note:** The backend's own `seed.js` uses slightly different passwords
> (`Admin@123`, `Sales@123`, etc. — without the trailing `5`).  The table above
> reflects the credentials used in this guide.  Use whichever set you prefer,
> but make sure the hash in the database was generated from the **same**
> plaintext you use when logging in.

---

## 6. Troubleshooting

### `401 Invalid credentials` after inserting a user via SQL

- The `password_hash` column contains plain text instead of a bcrypt hash.
- Fix: regenerate the hash with `scripts/generate_password_hash.py` and
  UPDATE the row:
  ```sql
  update public.users
  set password_hash = '$2a$12$CORRECT_BCRYPT_HASH_HERE',
      updated_at = now()
  where email = 'ceo@gutmann.com';
  ```

### `403 Account is deactivated`

- The `is_active` column is `false`.
- Fix:
  ```sql
  update public.users set is_active = true where email = 'ceo@gutmann.com';
  ```

### `409 Email already registered` from the register endpoint

- A user with that email already exists.  Either log in directly or delete
  the old row and re-register:
  ```sql
  delete from public.users where email = 'ceo@gutmann.com';
  ```

### `429 Too Many Requests`

- You've hit the rate limit (20 auth requests / 15 min).  Wait 15 minutes.

### `500 Registration failed` or `500 Login failed`

- Check that all required environment variables are set on Render:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`
- Check the Render backend logs (Render Dashboard → your service → Logs).

### `bcrypt` Python package fails to install

- Use the Node.js one-liner in [Option 4](#option-4--node-one-liner-if-python-is-unavailable) instead.

### The seed script (`npm run seed`)

You can also run the backend's built-in seed script directly from the Render
shell:

```bash
npm run seed
```

This creates/updates 5 users in one command (uses `bcryptjs` natively).
Note: the seed script uses its own hardcoded passwords — see `backend/seed.js`
for the exact values.
