# Creating Test Users in Supabase

This guide explains how to create the GUTMANN test users directly in Supabase without needing a local machine or curl.

---

## Background: How password hashing works in this project

The backend (`backend/src/controllers/AuthController.js`) uses **bcryptjs** with **salt rounds = 12**.

```js
// backend/src/controllers/AuthController.js (relevant excerpt)
const bcrypt = require('bcryptjs');          // library: bcryptjs
const hashedPassword = await bcrypt.hash(password, 12);  // salt rounds: 12
```

The database column is `password_hash` (not `password`).  
Inserting plain-text passwords will **always fail** login because the backend compares them via `bcrypt.compare()`.

---

## Why the AI assistant could not see the backend code directly

When you ask an AI assistant (like GitHub Copilot Chat) a question in a generic conversation, it only has access to the text you paste into the chat — it **cannot browse GitHub URLs on its own**.

To let the assistant see your backend code, you must:

1. **Use the Copilot Coding Agent** (this PR context) — the agent is given a local clone of the repository and can read every file.
2. **Paste the relevant code snippet** directly into the chat message.
3. **Open a file in VS Code / GitHub.dev** and use `@workspace` or `#file` references (e.g., `#file:backend/src/controllers/AuthController.js`) so Copilot has access to the specific file.
4. **Use GitHub Copilot CLI** with `gh copilot suggest` while inside the cloned repository.

A generic chat reply such as *"I can't see your backend code"* means the assistant is working without repository context. Always provide the file path or paste the key function.

---

## Option A — Run the helper script (GitHub Codespaces or local)

This is the recommended approach when you want to use **custom passwords**.

### Step 1 — Open a terminal

**GitHub Codespaces** (no local install needed):
1. Go to your repository on GitHub.
2. Click the green **Code** button → **Codespaces** tab → **Create codespace on main**.
3. A VS Code editor opens in your browser with a built-in terminal.

**Locally**: open a terminal in the cloned repository root.

### Step 2 — Install dependencies (once)

```bash
cd backend
npm install
cd ..
```

### Step 3 — Generate hashes for the default test users

```bash
node scripts/generate-bcrypt-hashes.js
```

The script prints each hash **and** a ready-to-paste SQL block.

### Step 4 — Generate a hash for a single custom password

```bash
node scripts/generate_bcrypt_hash.js "MySecret@99"
```

### Step 5 — Paste the SQL output into Supabase SQL Editor

Copy the entire SQL block printed by the script and run it in:  
**Supabase Dashboard → SQL Editor → New query → Run**

---

## Option B — Use the pre-generated SQL (GitHub-only, no terminal)

Pre-generated bcrypt hashes for the default test passwords are already embedded in `database/seeds/test_users.sql`.

Copy the entire file content and paste it into **Supabase → SQL Editor → New query → Run**.

| Email | Plain password | Role |
|---|---|---|
| `ceo@gutmann.com` | `Admin@12345` | ceo |
| `sales@gutmann.com` | `Sales@12345` | salesperson |
| `qc@gutmann.com` | `Qc@12345` | qc |
| `technical@gutmann.com` | `Tech@12345` | technical |
| `estimation@gutmann.com` | `Est@12345` | estimation |

> **Security note:** Change these passwords before using the system with real data.

---

## Option C — Quick single-user SQL (paste and customise)

If you want to insert just one user with a hash you already have:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT gen_random_uuid(),
       'myuser@example.com',
       '$2a$12$REPLACE_WITH_YOUR_BCRYPT_HASH',
       'My User',
       'ceo',   -- valid values: ceo | salesperson | qc | technical | estimation | client
       true,
       now(),
       now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'myuser@example.com');
```

Replace `$2a$12$REPLACE_WITH_YOUR_BCRYPT_HASH` with the hash from `scripts/gen_password_hash.js`.

---

## Verify users were created

Run in **Supabase → SQL Editor**:

```sql
SELECT email, name, role, is_active, created_at
FROM public.users
ORDER BY role, email;
```

---

## Test login after inserting users

```bash
curl -X POST https://YOUR-BACKEND.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ceo@gutmann.com","password":"Admin@12345"}'
```

A successful response contains a `token` field.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `column "password" does not exist` | Wrong column name | Use `password_hash` (see schema above) |
| Login returns `Invalid credentials` | Hash mismatch or plain-text in DB | Re-run `scripts/generate-bcrypt-hashes.js` and re-insert |
| `bcryptjs not found` | `npm install` not run | Run `cd backend && npm install` |
| `relation "users" does not exist` | Schema not applied | Run `database/migrations/001_initial_schema.sql` first |
