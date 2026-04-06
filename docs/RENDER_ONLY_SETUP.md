# Render Blueprint Setup

## Steps

### 1. Render dashboard → New → Blueprint

Go to [https://dashboard.render.com](https://dashboard.render.com) and click **New → Blueprint**.

### 2. Connect GitHub repo

Select **syedtaiq14sa/gutmann** and grant Render access if prompted.

### 3. Apply blueprint

Render reads `render.yaml` from the root and creates two services:
- `gutmann-backend` (Node web service)
- `gutmann-frontend` (Static site)

Click **Apply** to provision both services.

### 4. Set env vars

After provisioning, open each service in the Render dashboard and set the following environment variables under **Environment**:

**gutmann-backend**
| Variable | Value |
|---|---|
| `JWT_SECRET` | a long random secret |
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_ANON_KEY` | your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key |
| `FRONTEND_URL` | your frontend Render URL (e.g. `https://gutmann-frontend.onrender.com`) |

**gutmann-frontend**
| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | your backend Render URL + `/api` (e.g. `https://gutmann-backend.onrender.com/api`) |

### 5. Verify URLs

- Backend health: `https://gutmann-backend.onrender.com/api/health`
- Frontend: `https://gutmann-frontend.onrender.com`
