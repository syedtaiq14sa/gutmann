# Gutmann Setup Checklist

Use this checklist to track your progress when setting up the Gutmann Workflow Management System from scratch.

---

## Supabase Setup

- [ ] Created a Supabase account at [supabase.com](https://supabase.com)
- [ ] Created a new project named `gutmann`
- [ ] Noted the database password in a safe place
- [ ] Copied `SUPABASE_URL` from **Settings → API**
- [ ] Copied `SUPABASE_ANON_KEY` from **Settings → API**
- [ ] Copied `SUPABASE_SERVICE_ROLE_KEY` from **Settings → API**
- [ ] Ran `database/migrations/001_initial_schema.sql` in the SQL Editor – all 10 tables created ✅
- [ ] Ran `database/seeds/test_users.sql` in the SQL Editor – 6 test users created ✅

---

## Render.com Deployment

- [ ] Created a Render account at [render.com](https://render.com)
- [ ] Connected GitHub account to Render
- [ ] Created **gutmann-backend** Web Service (root: `backend`, start: `npm start`)
- [ ] Created **gutmann-frontend** Static Site (root: `frontend`, publish: `build`)
- [ ] Set backend environment variables:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET` (generated with `openssl rand -hex 32`)
  - [ ] `PORT` = `3001`
  - [ ] `NODE_ENV` = `production`
  - [ ] `SENDGRID_API_KEY` *(optional – for email notifications)*
- [ ] Set frontend environment variables:
  - [ ] `REACT_APP_API_URL`
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Backend deployed successfully (status: **Live**)
- [ ] Frontend deployed successfully (status: **Live**)

---

## Verification

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] Can log in as `ceo@gutmann.com` / `Admin@123` via the API
- [ ] Can log in via the frontend and see the CEO Dashboard
- [ ] Can create a new inquiry
- [ ] All 6 role dashboards are accessible with the correct test credentials
- [ ] End-to-end workflow (inquiry → approved) completed at least once

---

## Quick Reference

| Item | Value |
|---|---|
| Backend health URL | `https://gutmann-backend.onrender.com/api/health` |
| Frontend URL | `https://gutmann-frontend.onrender.com` |
| CEO login | `ceo@gutmann.com` / `Admin@123` |
| Salesperson login | `sales@gutmann.com` / `Sales@123` |
| QC login | `qc@gutmann.com` / `QC@12345` |
| Technical login | `tech@gutmann.com` / `Tech@123` |
| Estimation login | `estimation@gutmann.com` / `Est@1234` |
| Client login | `client@gutmann.com` / `Client@12` |

---

## Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Render Dashboard](https://dashboard.render.com)
- [Supabase Complete Setup Guide](docs/SUPABASE_COMPLETE_SETUP.md)
- [Render Complete Setup Guide](docs/RENDER_COMPLETE_SETUP.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [API Reference](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
