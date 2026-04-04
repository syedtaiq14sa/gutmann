# GUTMANN Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- Supabase account (free tier works)

## Step-by-Step Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/syedtaiq14sa/gutmann.git
cd gutmann
```

### Step 2: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Name: `gutmann`, choose region, set a database password
4. Wait 2-3 minutes for provisioning

5. Get credentials from **Settings → API**:
   - `SUPABASE_URL`: `https://xxxxx.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJ...`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJ...`

### Step 3: Run Database Schema

1. In Supabase → **SQL Editor** → **New Query**
2. Copy content from `database/migrations/001_initial_schema.sql`
3. Paste and click **Run** ▶️
4. All 10 tables will be created

### Step 4: Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-32-char-minimum-secret-key
```

### Step 5: Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

### Step 6: Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Step 7: Start Development Servers

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm start
```

### Step 8: Create First User

Use the API to register the CEO user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@gutmann.com",
    "password": "Admin@123",
    "name": "CEO Name",
    "role": "ceo"
  }'
```

Or use the default seed user from the SQL schema (email: `ceo@gutmann.com`, password: `Admin@123`).

## Troubleshooting

### Backend won't start
- Check `.env` file exists in `backend/` folder
- Verify `SUPABASE_URL` and keys are correct
- Run `npm install` to ensure dependencies are installed

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check `REACT_APP_API_URL` in frontend `.env`
- Check CORS settings in `backend/server.js`

### Database errors
- Verify SQL schema was run successfully in Supabase
- Check Supabase project is active (not paused)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not anon key

### Login fails
- The default admin password in the schema may need to be updated
- Create a new user via the register API endpoint
- Check JWT_SECRET is set in backend `.env`
