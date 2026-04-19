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
Hash  : $2a$12$hIEEFP/ftW2ySV/.TwsCj.GPkqrnJFA57la2LAN61m7307/cbQsxa

Label : salesperson
Hash  : $2a$12$6bFwE.s1zkitvjm2jeasguToA.9uXDKYU74oy4vlMZGoqzhExkhda

Label : qc
Hash  : $2a$12$OlI/v/f1pguac6mdY9/Kku6cmtlA0/YF1MOLt73vz9pEjIShUisz6

Label : technical
Hash  : $2a$12$EI4J3zILpyy8kVnacM0/jeVSGZSKteRX5OSxsxXNg.g2eXr3WtO5O

Label : estimation
Hash  : $2a$12$6zkLbpPF6wGyPbL2YlcmSu3sxY3WOjfvmJHngl9BWjxeuJuYvb2Wu
```

---

## SQL for Supabase SQL Editor

Open **Supabase Dashboard → SQL Editor → New query**, paste the SQL below, then click **Run**.

The statements are **idempotent**: they skip any email that already exists in the table.

```sql
-- pgcrypto provides gen_random_uuid(); safe to run even if already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CEO  (password: Admin@12345)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'ceo@gutmann.com',
  '$2a$12$hIEEFP/ftW2ySV/.TwsCj.GPkqrnJFA57la2LAN61m7307/cbQsxa',
  'Ahmad Al-Rashid',
  'ceo',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'ceo@gutmann.com'
);

-- Salesperson  (password: Sales@12345)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'sales@gutmann.com',
  '$2a$12$6bFwE.s1zkitvjm2jeasguToA.9uXDKYU74oy4vlMZGoqzhExkhda',
  'Sara Malik',
  'salesperson',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'sales@gutmann.com'
);

-- QC  (password: Qc@12345)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'qc@gutmann.com',
  '$2a$12$OlI/v/f1pguac6mdY9/Kku6cmtlA0/YF1MOLt73vz9pEjIShUisz6',
  'Fatima Zahra',
  'qc',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'qc@gutmann.com'
);

-- Technical  (password: Tech@12345)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'technical@gutmann.com',
  '$2a$12$EI4J3zILpyy8kVnacM0/jeVSGZSKteRX5OSxsxXNg.g2eXr3WtO5O',
  'Khalid Ibrahim',
  'technical',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE email = 'technical@gutmann.com'
);

-- Estimation  (password: Est@12345)
INSERT INTO public.users (id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'estimation@gutmann.com',
  '$2a$12$6zkLbpPF6wGyPbL2YlcmSu3sxY3WOjfvmJHngl9BWjxeuJuYvb2Wu',
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
| ceo          | ceo@gutmann.com          | Admin@12345   |
| salesperson  | sales@gutmann.com        | Sales@12345   |
| qc           | qc@gutmann.com           | Qc@12345      |
| technical    | technical@gutmann.com    | Tech@12345    |
| estimation   | estimation@gutmann.com   | Est@12345     |

> **Note**: These are development/test credentials only. Do not use them in production.
