# Checking Users in the Backend Database

Use the queries below to inspect the `public.users` table in your Supabase
(or any PostgreSQL-compatible) database. **No code changes are required.**
These are read-only `SELECT` statements unless marked otherwise.

---

## Where to run these queries

| Environment | How to open the SQL console |
|-------------|---------------------------|
| **Supabase** | Dashboard → your project → **SQL Editor → New query** |
| **Render shell** | Dashboard → your backend service → **Shell** tab, then `psql $DATABASE_URL` |
| **Local psql** | `psql "<your-connection-string>"` |

---

## 1. List all users

```sql
SELECT id, name, email, role, is_active, created_at
FROM   public.users
ORDER  BY created_at DESC;
```

Expected columns:

| Column | Description |
|--------|-------------|
| `id` | UUID primary key |
| `name` | Display name |
| `email` | Login email (unique) |
| `role` | One of: `ceo`, `salesperson`, `qc`, `technical`, `estimation`, `client` |
| `is_active` | `true` = account is enabled, `false` = deactivated |
| `created_at` | When the account was created |

---

## 2. Count all users

```sql
SELECT COUNT(*) AS total_users FROM public.users;
```

---

## 3. Check if a specific user exists by email

```sql
SELECT id, name, email, role, is_active
FROM   public.users
WHERE  email = 'someone@example.com';
```

Replace `someone@example.com` with the email you want to look up.
An empty result means the user does not exist.

---

## 4. Find users by role

```sql
-- All CEO accounts
SELECT id, name, email, is_active FROM public.users WHERE role = 'ceo';

-- All active salesperson accounts
SELECT id, name, email FROM public.users WHERE role = 'salesperson' AND is_active = true;
```

---

## 5. Check active vs. inactive users

```sql
SELECT role, is_active, COUNT(*) AS count
FROM   public.users
GROUP  BY role, is_active
ORDER  BY role, is_active;
```

---

## 6. Check last login for all users

```sql
SELECT email, name, role, last_login, is_active
FROM   public.users
ORDER  BY last_login DESC NULLS LAST;
```

---

## 7. Fix a deactivated account (write operation)

If a user cannot log in because `is_active` is `false`, run:

```sql
UPDATE public.users
SET    is_active  = true,
       updated_at = NOW()
WHERE  email = 'someone@example.com';
```

---

## Shell script (`scripts/check_users.sh`)

For a quick terminal-based check in a Render shell or any environment where
`psql` is available, use the companion script:

```bash
bash scripts/check_users.sh
```

See [`scripts/check_users.sh`](../scripts/check_users.sh) for the full script.

---

## See also

- [Database Schema Reference](DATABASE_SCHEMA.md) — full table definitions
- [AUTH_TEST_USERS.md](AUTH_TEST_USERS.md) — how to create / reset test users
