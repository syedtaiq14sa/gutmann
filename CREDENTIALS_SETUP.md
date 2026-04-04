# Credentials Setup — Quick Reference

## Supabase URLs

| Item | Value |
|---|---|
| **Supabase Project URL** | `https://ewjbhcqnkbuxbvstdbnc.supabase.co` |
| **Supabase Dashboard** | [https://supabase.com/dashboard/project/ewjbhcqnkbuxbvstdbnc](https://supabase.com/dashboard/project/ewjbhcqnkbuxbvstdbnc) |
| **Database Host** | `db.ewjbhcqnkbuxbvstdbnc.supabase.co` |
| **Database Port** | `5432` |
| **Database Name** | `postgres` |

---

## Environment Variables

### Backend (copy to `backend/.env`)

```
SUPABASE_URL=https://ewjbhcqnkbuxbvstdbnc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3amJoY3Fua2J1eGJ2c3RkYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk4MzMsImV4cCI6MjA5MDg1NTgzM30.8Sc3uPYNg8NGcn_Qwc5pCs1TIM_mdDnXx8KwuO3ajgo
SUPABASE_SERVICE_ROLE_KEY=<get_from_supabase_settings>
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ewjbhcqnkbuxbvstdbnc.supabase.co:5432/postgres
JWT_SECRET=<generate_strong_random_string>
PORT=3001
NODE_ENV=production
FRONTEND_URL=<your_render_frontend_url>
```

### Frontend (copy to `frontend/.env`)

```
REACT_APP_API_URL=<your_render_backend_url>/api
REACT_APP_SUPABASE_URL=https://ewjbhcqnkbuxbvstdbnc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3amJoY3Fua2J1eGJ2c3RkYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk4MzMsImV4cCI6MjA5MDg1NTgzM30.8Sc3uPYNg8NGcn_Qwc5pCs1TIM_mdDnXx8KwuO3ajgo
REACT_APP_SOCKET_URL=<your_render_backend_url>
```

---

## Setting Variables in Render

1. Go to [https://render.com](https://render.com) and open your service.
2. Click **Environment** in the left sidebar.
3. Click **Add Environment Variable**.
4. Enter the variable name and value from the tables above.
5. Click **Save Changes** — Render will redeploy automatically.

---

## Database Password Recovery

If you have lost the database password:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ewjbhcqnkbuxbvstdbnc/settings/database).
2. Click **Project Settings** → **Database**.
3. Click **Reset database password** to generate a new password.
4. Update `DATABASE_URL` in all services with the new password.

---

## Security Reminder

- Never commit `.env` files — they are excluded by `.gitignore`.
- The `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side (backend).
- Rotate any credential that is accidentally exposed publicly.
