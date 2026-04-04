# GUTMANN System Architecture

## Overview

GUTMANN is a multi-tier project workflow management system designed for engineering firms to track projects from initial inquiry through to client approval.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│              (Browser - React SPA)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND                                   │
│           React 18 + Redux Toolkit                           │
│     ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│     │Dashboard │ │ Projects │ │ Reports  │                  │
│     └──────────┘ └──────────┘ └──────────┘                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API + WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND                                    │
│              Node.js + Express 4                             │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │  Auth   │ │Workflow  │ │Notif-    │ │ Report         │ │
│  │ Routes  │ │ Engine   │ │ ication  │ │ Service        │ │
│  └─────────┘ └──────────┘ └──────────┘ └────────────────┘ │
│                                                              │
│              Socket.IO (Real-time)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ Supabase SDK
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE                                  │
│                  (PostgreSQL)                                │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐                  │
│  │  users   │ │ inquiries  │ │quotations│                  │
│  └──────────┘ └────────────┘ └──────────┘                  │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐                  │
│  │qc_reviews│ │ tech_review│ │notificat │                  │
│  └──────────┘ └────────────┘ └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Workflow State Machine

```
RECEIVED ──────────────────────────────────────────────────────┐
   │                                                           │
   ▼ (salesperson forwards)                                    │
QC_REVIEW ◄──── QC_REVISION                                   │
   │                   ▲                                       │
   ▼ (qc approves)     │ (revision needed)                    │
TECHNICAL_REVIEW ◄──── TECHNICAL_REVISION                     │
   │                   ▲                                       │
   ▼ (technical approves)                                      │
ESTIMATION                                                      │
   │                                                           │
   ▼ (estimator submits quotation)                             │
CEO_APPROVAL ─────────────────────────────────────────────────┘
   │                                                           │
   ├──► CLIENT_REVIEW ─────► APPROVED ✅                       │
   │                   │                                       │
   │                   └──► REJECTED ❌                        │
   └──► REJECTED ❌                                            │
   └──► (back to ESTIMATION for revision)
```

## Authentication & Authorization

- **JWT tokens** with 7-day expiry
- **Role-based access control (RBAC)**:
  - Routes protected by `authenticate` middleware
  - Fine-grained access via `authorize(...roles)` middleware

## Real-time Updates

Socket.IO is used for:
- Project status change notifications
- New task assignments
- Bottleneck alerts

## Database Design Principles

1. **UUID primary keys** - globally unique identifiers
2. **Soft deletes** via `is_active` flags where applicable
3. **Audit trail** via `audit_log` and `workflow_transitions` tables
4. **JSONB columns** for flexible metadata (contact_info, technical_specs, boq_items)
5. **Automatic timestamps** via PostgreSQL triggers

## Security Measures

- bcrypt password hashing (cost factor 12)
- JWT token verification on all protected routes
- Role-based route authorization
- SQL injection prevention via parameterized queries (Supabase SDK)
- CORS configured to allow only frontend origin
- Environment variables for all secrets (never hardcoded)
