# Setup Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- npm 9+
- A Supabase account (free tier works)

---

## 1. Clone the Repository

```bash
git clone https://github.com/syedtaiq14sa/gutmann.git
cd gutmann
```

---

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your Supabase credentials (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)).

```bash
npm run dev
# Backend running on http://localhost:3001
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

```bash
npm start
# Frontend running on http://localhost:3000
```

---

## 4. Database Setup

1. Run migration in Supabase SQL Editor:
   - `database/migrations/001_initial_schema.sql`

2. Optionally seed test data:
   - `database/seeds/test_users.sql`
   - `database/seeds/sample_inquiries.sql`

---

## 5. Test Logins (after seeding)

| Role | Email | Password |
|------|-------|----------|
| CEO | ceo@gutmann.com | Test@1234 |
| Salesperson | sales1@gutmann.com | Test@1234 |
| QC | qc@gutmann.com | Test@1234 |
| Technical | technical@gutmann.com | Test@1234 |
| Estimation | estimation@gutmann.com | Test@1234 |
| Client | client1@example.com | Test@1234 |

> **Note**: Update passwords using Supabase Auth or backend registration endpoint.

---

## 6. Docker Setup (Alternative)

```bash
# From repo root
docker-compose up
# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

---

## 7. Deploy to Render

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment instructions.

**Quick deploy:**
1. Push to GitHub main branch
2. Connect repo to Render
3. Select `render.yaml` as config
4. Add environment variables
5. Deploy

---

## Environment Variables Reference

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `JWT_SECRET` | ✅ | Random string for JWT signing |
| `JWT_EXPIRY` | ❌ | JWT expiry (default: 7d) |
| `PORT` | ❌ | Server port (default: 3001) |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `EMAIL_SERVICE` | ❌ | Email service (nodemailer) |
| `EMAIL_USER` | ❌ | Email username |
| `EMAIL_PASS` | ❌ | Email password |

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | ✅ | Backend API URL |
| `REACT_APP_SUPABASE_URL` | ❌ | Supabase URL (for direct queries) |
| `REACT_APP_SUPABASE_ANON_KEY` | ❌ | Supabase anon key |
| `REACT_APP_SOCKET_URL` | ✅ | WebSocket server URL |
