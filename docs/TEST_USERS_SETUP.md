# Test Users Setup Guide

This guide explains how to create test users directly in the Supabase SQL Editor for the Gutmann system.

---

## Table Schema (`public.users`)

| Column          | Type                     | Notes                              |
|-----------------|--------------------------|------------------------------------|
| `id`            | uuid                     | Primary key, auto-generated        |
| `email`         | character varying        | Unique                             |
| `password_hash` | character varying        | bcrypt hash (12 rounds)            |
| `name`          | character varying        |                                    |
| `role`          | character varying        | ceo, salesperson, qc, technical, estimation |
| `is_active`     | boolean                  | Default true                       |
| `last_login`    | timestamp with time zone | Nullable                           |
| `created_at`    | timestamp with time zone |                                    |
| `updated_at`    | timestamp with time zone |                                    |

---

## How the Backend Hashes Passwords

The backend (`backend/src/controllers/AuthController.js`) uses **bcryptjs with 12 salt rounds**:

```js
// Registration
const hashedPassword = await bcrypt.hash(password, 12);

// Login verification
const isValid = await bcrypt.compare(password, user.password_hash);
```

You **must** insert a valid bcrypt hash into `password_hash`; plain-text passwords will not work.

---

## Helper Script: Generating New Hashes

A Node.js helper script is provided at `scripts/generate-bcrypt-hashes.js`.

### Prerequisites

```bash
cd backend
npm ci
cd ..
```

### Run with default test passwords

```bash
node scripts/generate-bcrypt-hashes.js
```

### Run with custom passwords

```bash
node scripts/generate-bcrypt-hashes.js "MyPassword@1" "AnotherPass@2"
```

### Example output

```
Generating bcrypt hashes with 12 rounds...

Label : ceo
Hash  : $2a$12$MMQYNZ0PvffLBX65iRwqdeXSz3v7hfRBGo0J7MABrs7DJ2iRTNSRi

Label : salesperson
Hash  : $2a$12$3G2ts9fH5.q2URCNVT/EaOacjGBme0uzGTXZpkBcTNdi7seKmb7TO

Label : qc
Hash  : $2a$12$O5xjNev7LZsAwjTJ5nBaeu4Wtn2ASdz3Jsqe2HwZQOb2QF7lQNEki

Label : technical
Hash  : $2a$12$tbCZB7YK3md3cj4bFpD6N.LGXp2oURpGk5T/ytS0oppCGUNXy5WtW

Label : estimation
Hash  : $2a$12$7.z2CbS6TdZfbPGyKlW6NOG.f8LUQuzsyE4h23NCixn8osroHrtrG
```

> **Tip**: For the full seed with all 8 users and client accounts, run
> `node scripts/gen_password_hash.js` or paste `database/seeds/test_users.sql`
> directly into the Supabase SQL Editor.

---

## SQL for Supabase SQL Editor

Open **Supabase Dashboard → SQL Editor → New query**, paste the SQL below, then click **Run**.

The statements are **idempotent**: they skip any email that already exists in the table.

> **Recommended**: Use `database/seeds/test_users.sql` for the full 8-user seed with
> pre-generated hashes. The SQL below covers the 5 core roles only and uses
> `gen_random_uuid()` for IDs. Run `node scripts/generate-bcrypt-hashes.js` to
> regenerate fresh hashes before inserting.

```sql
-- pgcrypto provides gen_random_uuid(); safe to run even if already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CEO  (password: Admin@123)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'ceo@gutmann.com',
  '$2a$12$MMQYNZ0PvffLBX65iRwqdeXSz3v7hfRBGo0J7MABrs7DJ2iRTNSRi',
  'Ahmad Al-Rashid',
  'ceo',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'ceo@gutmann.com'
);

-- Salesperson  (password: Sales@123 — regenerate hash with: node scripts/generate-bcrypt-hashes.js)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'sales@gutmann.com',
  '$2a$12$3G2ts9fH5.q2URCNVT/EaOacjGBme0uzGTXZpkBcTNdi7seKmb7TO',
  'Sara Malik',
  'salesperson',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'sales@gutmann.com'
);

-- QC  (password: QC@1234)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'qc@gutmann.com',
  '$2a$12$O5xjNev7LZsAwjTJ5nBaeu4Wtn2ASdz3Jsqe2HwZQOb2QF7lQNEki',
  'Fatima Zahra',
  'qc',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'qc@gutmann.com'
);

-- Technical  (password: Tech@123)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'technical@gutmann.com',
  '$2a$12$tbCZB7YK3md3cj4bFpD6N.LGXp2oURpGk5T/ytS0oppCGUNXy5WtW',
  'Khalid Ibrahim',
  'technical',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'technical@gutmann.com'
);

-- Estimation  (password: Est@1234)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'estimation@gutmann.com',
  '$2a$12$7.z2CbS6TdZfbPGyKlW6NOG.f8LUQuzsyE4h23NCixn8osroHrtrG',
  'Nadia Hassan',
  'estimation',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'estimation@gutmann.com'
);

-- Verify
SELECT id, email, name, role, is_active, created_at
FROM public.users
WHERE email IN (
  'ceo@gutmann.com',
  'sales@gutmann.com',
  'qc@gutmann.com',
  'technical@gutmann.com',
  'estimation@gutmann.com'
)
ORDER BY
  CASE role
    WHEN 'ceo'         THEN 1
    WHEN 'salesperson' THEN 2
    WHEN 'qc'          THEN 3
    WHEN 'technical'   THEN 4
    WHEN 'estimation'  THEN 5
  END;
```

The final `SELECT` should return 5 rows confirming all users were created.

---

## Test Credentials Summary

| Role         | Email                    | Password      |
|--------------|--------------------------|---------------|
| ceo          | ceo@gutmann.com          | Admin@123     |
| salesperson  | sales@gutmann.com        | Sales@123     |
| qc           | qc@gutmann.com           | QC@1234       |
| technical    | technical@gutmann.com    | Tech@123      |
| estimation   | estimation@gutmann.com   | Est@1234      |

> **Note**: These are development/test credentials only. Do not use them in production.
> For the full 8-user seed (including two salesperson accounts and two client accounts),
> use `database/seeds/test_users.sql` directly.
