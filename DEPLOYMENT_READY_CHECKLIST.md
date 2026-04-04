# Deployment Ready Checklist

Use this checklist to confirm every step is complete before going live.

## Supabase Setup

- [x] Supabase project created (`ewjbhcqnkbuxbvstdbnc`)
- [x] Credentials obtained (URL, anon key, service role key)
- [ ] Database schema executed (`database/migrations/001_initial_schema.sql`)
- [ ] Test users created in Supabase Auth

## Render — Backend

- [ ] Backend Web Service created on Render
- [ ] Environment variables added to Render backend service:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `PORT`
  - [ ] `NODE_ENV`
  - [ ] `FRONTEND_URL`
- [ ] Backend deployed successfully
- [ ] Backend health check endpoint responding (`/api/health`)

## Render — Frontend

- [ ] Frontend Static Site created on Render
- [ ] Environment variables added to Render frontend service:
  - [ ] `REACT_APP_API_URL`
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`
  - [ ] `REACT_APP_SOCKET_URL`
- [ ] Frontend deployed successfully
- [ ] Frontend loads in browser

## Verification

- [ ] Login page accessible
- [ ] Authentication working (sign in with a test user)
- [ ] API calls from frontend reaching backend
- [ ] Data loading from Supabase database
- [ ] Connection between frontend and backend verified

## References

- [Credentials Setup](./CREDENTIALS_SETUP.md)
- [Supabase Credentials Guide](./docs/SUPABASE_CREDENTIALS.md)
- [Render Deployment Guide](./docs/RENDER_DEPLOYMENT.md)
