# API Documentation

## Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-backend.onrender.com/api`

## Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /auth/login
Login and receive JWT token.
```json
{ "email": "user@example.com", "password": "password" }
```
**Response**: `{ "token": "...", "user": { "id": "...", "name": "...", "role": "..." } }`

### GET /auth/me
Get current user profile. **(Authenticated)**

### POST /auth/logout
Logout current session. **(Authenticated)**

---

## Inquiry Endpoints

### POST /inquiries
Create new inquiry. **(Salesperson)**
```json
{
  "client_name": "John Smith",
  "client_email": "john@example.com",
  "project_type": "commercial",
  "project_description": "Office HVAC installation",
  "location": "Dubai, UAE"
}
```

### GET /inquiries
List all inquiries with role-based filtering. **(All staff)**
- Query: `?status=qc_review&page=1&limit=20&search=Smith`

### GET /inquiries/:id
Get inquiry details including reviews and quotation.

### PUT /inquiries/:id
Update inquiry fields. **(Salesperson, CEO)**

### GET /inquiries/:id/history
Get full audit trail for an inquiry.

### PUT /inquiries/:id/stage
Move inquiry to next workflow stage.
```json
{ "new_status": "qc_review", "notes": "Ready for QC" }
```

---

## QC Endpoints

### GET /qc/pending
Get inquiries pending QC review. **(QC, CEO)**

### POST /qc/review
Submit QC review decision. **(QC)**
```json
{
  "inquiry_id": "uuid",
  "decision": "approved",
  "remarks": "All documents verified",
  "checklist": { "documents_complete": true }
}
```

### GET /qc/history/:inquiry_id
Get QC review history for an inquiry.

---

## Technical Endpoints

### GET /technical/pending
Get inquiries pending technical review. **(Technical, CEO)**

### POST /technical/review
Submit technical evaluation. **(Technical)**
```json
{
  "inquiry_id": "uuid",
  "system_type": "HVAC",
  "feasibility": "feasible",
  "estimated_duration": 90,
  "decision": "approved"
}
```

---

## Estimation Endpoints

### GET /estimation/pending
Get inquiries pending quotation. **(Estimation, CEO)**

### POST /estimation/quotation
Create quotation. **(Estimation)**
```json
{
  "inquiry_id": "uuid",
  "estimated_cost": 280000,
  "final_price": 350000,
  "validity_days": 30,
  "payment_terms": "30% upfront"
}
```

### PUT /estimation/quotation/:id
Update existing quotation.

---

## CEO Endpoints

### GET /ceo/pending
Get inquiries awaiting CEO approval. **(CEO)**

### POST /ceo/approve
CEO decision on quotation. **(CEO)**
```json
{
  "inquiry_id": "uuid",
  "decision": "approved",
  "notes": "Approved with conditions",
  "adjusted_price": 320000
}
```

### GET /ceo/analytics
Get revenue and performance analytics. **(CEO)**

---

## Dashboard Endpoints

### GET /dashboard/projects
Get projects relevant to current user's role. **(All staff)**

### GET /dashboard/tasks
Get task queue for current user. **(All staff)**

### GET /dashboard/reports
Get report data for charts. **(All staff)**

---

## Client Endpoints

### GET /client/quotations
Get client's quotations. **(Client)**

### POST /client/:id/accept
Accept a quotation.

### POST /client/:id/reject
Reject a quotation.
```json
{ "reason": "Budget constraints" }
```

### POST /client/:id/negotiate
Request price negotiation.
```json
{ "message": "Can you reduce by 10%?", "counter_offer": 315000 }
```

### GET /client/status
Get project status overview.

---

## Notification Endpoints

### GET /notifications
Get user's notifications.

### PATCH /notifications/:id/read
Mark notification as read.

---

## Health Check

### GET /health
Server health status.
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }
```

---

## Error Responses

All errors follow this format:
```json
{ "error": "Description of the error" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 429 | Too many requests |
| 500 | Internal server error |
