# Supabase Credentials Guide

## Project Details

| Item | Value |
|---|---|
| **Project URL** | `https://ewjbhcqnkbuxbvstdbnc.supabase.co` |
| **Project Reference** | `ewjbhcqnkbuxbvstdbnc` |

---

## Where to Find Credentials in Supabase

1. Log in to [https://supabase.com](https://supabase.com).
2. Open your project.
3. Go to **Project Settings** → **API**.

You will see:
- **Project URL** — the `SUPABASE_URL`
- **anon / public** key — the `SUPABASE_ANON_KEY` (JWT)
- **service_role** key — the `SUPABASE_SERVICE_ROLE_KEY` (**keep secret, never expose in frontend**)

---

## JWT Key vs Publishable Key

| Key Type | Format | Where to Use |
|---|---|---|
| **Publishable Key** | `sb_publishable_...` | Supabase dashboard UI only; not used in app code |
| **JWT (anon) Key** | `eyJ...` (long JWT string) | Use in all app environment variables (`SUPABASE_ANON_KEY`) |

The JWT key is the one that must be used in `SUPABASE_ANON_KEY` for both backend and frontend.

---

## Where Each Credential Goes

| Credential | Backend `.env` | Frontend `.env` |
|---|---|---|
| `SUPABASE_URL` | ✅ `SUPABASE_URL` | ✅ `REACT_APP_SUPABASE_URL` |
| JWT anon key | ✅ `SUPABASE_ANON_KEY` | ✅ `REACT_APP_SUPABASE_ANON_KEY` |
| `service_role` key | ✅ `SUPABASE_SERVICE_ROLE_KEY` | ❌ Never expose in frontend |
| `DATABASE_URL` | ✅ `DATABASE_URL` | ❌ Never expose in frontend |

---

## Security Notes

- **Never commit `.env` files** to version control. The `.gitignore` in this project already excludes `.env`.
- The `service_role` key bypasses Row Level Security — keep it server-side only.
- The `SUPABASE_ANON_KEY` (JWT) is safe to use in the frontend as it is subject to RLS policies.
- Rotate keys immediately if they are ever accidentally exposed in a public commit.

---

## Quick Reference

```
SUPABASE_URL=https://ewjbhcqnkbuxbvstdbnc.supabase.co

# JWT anon key — use for SUPABASE_ANON_KEY and REACT_APP_SUPABASE_ANON_KEY
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3amJoY3Fua2J1eGJ2c3RkYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk4MzMsImV4cCI6MjA5MDg1NTgzM30.8Sc3uPYNg8NGcn_Qwc5pCs1TIM_mdDnXx8KwuO3ajgo

# Retrieve from Supabase → Project Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=<get_from_supabase_settings>

# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ewjbhcqnkbuxbvstdbnc.supabase.co:5432/postgres
```
