# Database Schema Reference

## Overview

The GUTMANN database uses PostgreSQL via Supabase. The schema has 10 tables designed to support the complete project workflow.

---

## Tables

### `users`
Stores all system users (staff and clients).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| email | TEXT UNIQUE | Login email |
| name | TEXT | Display name |
| role | TEXT | `ceo`, `salesperson`, `qc`, `technical`, `estimation`, `client` |
| is_active | BOOLEAN | Account active status |
| created_at | TIMESTAMPTZ | Account creation time |

---

### `inquiries`
Core table representing project requests and their workflow state.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| inquiry_number | TEXT UNIQUE | Auto-generated: `INQ-YYYYMMDD-XXXX` |
| client_name | TEXT | Client full name |
| client_email | TEXT | Client contact email |
| client_phone | TEXT | Client phone number |
| client_company | TEXT | Client company name |
| project_type | TEXT | `residential`, `commercial`, `industrial`, `infrastructure`, `other` |
| project_description | TEXT | Project details |
| location | TEXT | Project location |
| budget_range | TEXT | Client's budget range |
| status | TEXT | Current workflow stage (see Workflow Stages) |
| priority | TEXT | `low`, `medium`, `high` |
| bottleneck_flag | BOOLEAN | Auto-set when SLA is breached |
| created_by | UUID (FK→users) | Salesperson who created it |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last modification timestamp |

---

### `qc_reviews`
QC department review records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| inquiry_id | UUID (FK→inquiries) | Related inquiry |
| reviewer_id | UUID (FK→users) | QC team member |
| checklist | JSONB | QC checklist results |
| remarks | TEXT | Reviewer notes |
| status | TEXT | `approved` or `rejected` |
| created_at | TIMESTAMPTZ | Review timestamp |

---

### `technical_reviews`
Technical department evaluation records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| inquiry_id | UUID (FK→inquiries) | Related inquiry |
| reviewer_id | UUID (FK→users) | Technical reviewer |
| system_type | TEXT | Type of system (HVAC, Electrical, etc.) |
| technical_specs | JSONB | Detailed technical specifications |
| feasibility | TEXT | `feasible`, `feasible_with_conditions`, `not_feasible` |
| estimated_duration | INTEGER | Estimated project duration in days |
| remarks | TEXT | Technical notes |
| status | TEXT | `approved` or `rejected` |
| created_at | TIMESTAMPTZ | Review timestamp |

---

### `quotations`
Financial quotations created by Estimation department.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| inquiry_id | UUID (FK→inquiries) | Related inquiry |
| estimator_id | UUID (FK→users) | Estimation team member |
| estimated_cost | DECIMAL | Internal cost estimate |
| final_price | DECIMAL | Price quoted to client |
| validity_days | INTEGER | Quote validity period |
| payment_terms | TEXT | Payment schedule |
| scope_of_work | TEXT | What's included |
| exclusions | TEXT | What's not included |
| ceo_adjusted | BOOLEAN | Whether CEO modified price |
| status | TEXT | `draft`, `submitted`, `approved`, `accepted`, `rejected` |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

### `notifications`
System notifications for all users.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| user_id | UUID (FK→users) | Recipient |
| type | TEXT | Notification type |
| message | TEXT | Notification content |
| data | JSONB | Additional metadata |
| read | BOOLEAN | Read/unread status |
| created_at | TIMESTAMPTZ | Sent timestamp |

---

### `audit_log`
Complete audit trail of all actions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique identifier |
| action | TEXT | Action performed |
| entity_type | TEXT | Type of entity affected |
| entity_id | UUID | Affected entity ID |
| performed_by | UUID (FK→users) | User who performed action |
| details | JSONB | Action details/metadata |
| created_at | TIMESTAMPTZ | Action timestamp |

---

## Workflow Stages

```
received → qc_review → qc_revision → technical_review → technical_revision
       → estimation → ceo_approval → client_review → approved
                                                    ↓
                                                  rejected
```

## Relationships

```
users ──────┬── inquiries (created_by)
            ├── qc_reviews (reviewer_id)
            ├── technical_reviews (reviewer_id)
            ├── quotations (estimator_id)
            └── notifications (user_id)

inquiries ──┬── qc_reviews
            ├── technical_reviews
            └── quotations
```
