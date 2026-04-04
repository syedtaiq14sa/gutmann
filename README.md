# GUTMANN Project Workflow Management System

A full-stack project workflow management system for engineering project tracking, built with React.js and Node.js/Express, powered by Supabase.

## 🏗️ Architecture

```
gutmann/
├── frontend/          # React.js SPA with Redux
├── backend/           # Node.js/Express API
├── database/          # PostgreSQL schema (Supabase)
├── .github/workflows/ # CI/CD pipelines
└── docs/              # Documentation
```

## 🔄 Project Workflow

```
Inquiry → QC Review → Technical Review → Estimation → CEO Approval → Client Review → Approved/Rejected
```

## 👥 User Roles

| Role | Access |
|------|--------|
| **CEO** | Full visibility, final approvals, analytics |
| **Sales Person** | Create inquiries, track own projects |
| **QC** | Quality control reviews |
| **Technical** | Technical feasibility reviews |
| **Estimation** | Cost estimation & quotations |
| **Client** | View own project status |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- npm or yarn

### 1. Clone & Setup

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your API URL
```

### 3. Setup Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   ```
   database/migrations/001_initial_schema.sql
   ```

### 4. Run Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

## 🐳 Docker Development

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
docker-compose up
```

## ☁️ Deploy to Render

See [docs/RENDER_DEPLOYMENT.md](docs/RENDER_DEPLOYMENT.md) for complete Render deployment instructions.

Quick deploy:
1. Connect your GitHub repo to Render
2. The `render.yaml` file configures both services automatically
3. Set environment variables in Render dashboard

## 📚 Documentation

- [API Reference](docs/API.md)
- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/RENDER_DEPLOYMENT.md)

## 🔧 Tech Stack

**Frontend:**
- React 18 + Redux Toolkit
- React Router v6
- Recharts (data visualization)
- Socket.IO client (real-time updates)
- Axios (HTTP client)

**Backend:**
- Node.js + Express 4
- Supabase (PostgreSQL + Auth)
- Socket.IO (real-time)
- JWT Authentication
- Nodemailer (email notifications)

**Database:**
- PostgreSQL via Supabase
- 10 tables with full referential integrity
- UUID primary keys
- Automatic timestamps

## 📄 License

ISC
