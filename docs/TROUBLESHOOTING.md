# Troubleshooting Guide

Common issues encountered when setting up and running the Gutmann Workflow Management System, with step-by-step solutions.

---

## Supabase Issues

### Project stuck on "Setting up"
- **Cause**: Provisioning can take up to 5 minutes on first creation.
- **Fix**: Refresh the Supabase dashboard page. If it is still setting up after 10 minutes, delete the project and create a new one.

### `ERROR: extension "uuid-ossp" does not exist`
- **Cause**: The extension is not enabled for your database.
- **Fix**:
  1. In Supabase go to **Database → Extensions**.
  2. Search for `uuid-ossp` and enable it.
  3. Re-run the migration SQL.

### `ERROR: relation "users" already exists`
- **Cause**: The schema was run more than once.
- **Fix**: The migration uses `CREATE TABLE IF NOT EXISTS`, so re-running it is safe. Ignore this message or drop the tables and re-run if you need a clean state.

### `duplicate key value violates unique constraint "users_email_key"`
- **Cause**: A user with that email already exists from a previous seed run.
- **Fix**: Safe to ignore (`ON CONFLICT (email) DO NOTHING` handles this). If you want fresh data, run `DELETE FROM users;` first.

### Project paused (free tier)
- **Cause**: Supabase free-tier projects pause after 7 days of inactivity.
- **Fix**: Open your project in the Supabase dashboard and click **Restore project**. It takes about 2 minutes to restore.

---

## Backend Issues

### Backend won't start – `Error: Cannot find module '...'`
- **Cause**: Dependencies not installed.
- **Fix**:
  ```bash
  cd backend
  npm install
  ```

### `Error: SUPABASE_URL is not defined`
- **Cause**: The `.env` file is missing or empty.
- **Fix**:
  ```bash
  cd backend
  cp .env.example .env
  # Edit .env and fill in your Supabase credentials
  ```

### `Error: JWT_SECRET must be at least 32 characters`
- **Cause**: `JWT_SECRET` is too short or not set.
- **Fix**: Generate a secure secret:
  ```bash
  openssl rand -hex 32
  # Windows alternative:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Paste the output as the value of `JWT_SECRET` in `.env`.

### `Error: connect ECONNREFUSED` when calling Supabase
- **Cause**: Wrong `SUPABASE_URL` or network issue.
- **Fix**:
  - Double-check the URL in **Supabase → Settings → API**.
  - Ensure the URL starts with `https://` and ends with `.supabase.co` (no trailing slash).
  - Verify internet connectivity.

### Port 3001 already in use
- **Cause**: Another process is using the port.
- **Fix**:
  ```bash
  # macOS / Linux
  lsof -i :3001
  kill -9 <PID>

  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F
  ```

---

## Frontend Issues

### Blank white page after login
- **Cause**: `REACT_APP_API_URL` is pointing to the wrong backend URL.
- **Fix**:
  1. Open browser DevTools (F12) → **Console** tab.
  2. Look for network errors (e.g., `net::ERR_CONNECTION_REFUSED`).
  3. Confirm `REACT_APP_API_URL` in `frontend/.env` matches the running backend address.
  4. Rebuild the frontend: `npm run build` (or restart the dev server).

### `CORS error` in browser console
- **Cause**: The backend CORS configuration does not include the frontend origin.
- **Fix**:
  1. Open `backend/server.js`.
  2. Find the CORS configuration and add your frontend URL to the allowed origins list.
  3. Restart the backend.

### Login fails with "Invalid credentials"
- **Cause**: The user does not exist in the database, or the password is wrong.
- **Fix**: Register a new user via the API registration endpoint (see `docs/TESTING_GUIDE.md`).

### `REACT_APP_*` variables not picked up in production
- **Cause**: Environment variables must be set before the React build runs; they are baked into the static bundle.
- **Fix**: On Render.com, set variables under the **Environment** tab, then trigger a **Manual Deploy**.

---

## Render.com Deployment Issues

### Build fails – `npm ERR! code ENOENT`
- **Cause**: The **Root Directory** setting is missing.
- **Fix**: In the Render service settings, set **Root Directory** to `backend` (for the API) or `frontend` (for the static site).

### Service shows "Build failed" in logs
- **Cause**: Usually a missing environment variable or syntax error.
- **Fix**:
  1. In Render, open the service → **Logs** tab.
  2. Read the error message carefully.
  3. Add any missing environment variables under the **Environment** tab.
  4. Redeploy.

### Free-tier service goes to sleep
- **Cause**: Render free-tier web services spin down after 15 minutes of inactivity.
- **Fix**: The first request after sleep takes 10–30 seconds. To avoid this, upgrade to the **Starter** plan ($7/month) for always-on services.

### `Application error` page on the frontend
- **Cause**: The frontend build directory is wrong.
- **Fix**: In the static site settings, ensure **Publish Directory** is set to `build` (Create React App output folder).

---

## Authentication / JWT Issues

### `401 Unauthorized` on all API calls
- **Cause**: JWT token is missing, malformed, or expired.
- **Fix**:
  - Confirm the `Authorization: Bearer <token>` header is sent with every request.
  - Tokens expire after the period configured in `JWT_EXPIRES_IN` (default: 7 days). Log in again to get a fresh token.
  - Verify `JWT_SECRET` in the backend `.env` matches the secret that was used to sign the token.

### `403 Forbidden` on a specific endpoint
- **Cause**: The logged-in user's role does not have permission to perform that action.
- **Fix**: Log in as a user with the required role (e.g., CEO for admin actions). See `docs/TESTING_GUIDE.md` for role credentials.

---

## Database / SQL Issues

### `relation "users" does not exist`
- **Cause**: The migration was not run, or it ran against the wrong database.
- **Fix**: Run `database/migrations/001_initial_schema.sql` in the Supabase SQL Editor.

### Trigger creation error `trigger already exists`
- **Cause**: Re-running the migration after triggers were already created.
- **Fix**: The migration script uses `IF NOT EXISTS` for trigger creation. If you see this error, you are using an older PostgreSQL version that does not support it. Drop and recreate the triggers manually or ignore the error.

### `invalid input syntax for type uuid`
- **Cause**: A UUID field received a non-UUID string.
- **Fix**: Ensure all `id` fields sent in API requests are valid UUIDs (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

---

## Getting More Help

1. Check the browser **DevTools Console** for JavaScript errors.
2. Check the Render **Logs** tab for server errors.
3. Check the Supabase **Logs → API** section for database query errors.
4. Open an issue in the GitHub repository with:
   - A description of what you were doing
   - The exact error message
   - Which environment (local / Render) and which service (backend / frontend)
