# GUTMANN API Reference

Base URL: `http://localhost:3001/api` (development)

## Authentication

All protected endpoints require: `Authorization: Bearer <token>`

---

## Auth Endpoints

### POST /auth/register
Register new user.
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "salesperson"
}
```

### POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
Returns: `{ user, token }`

### GET /auth/me
Returns current user profile. Requires auth.

---

## Dashboard Endpoints

### GET /dashboard/projects
Returns projects visible to the authenticated user based on role.

### GET /dashboard/tasks
Returns task queue for the authenticated user's role.

### GET /dashboard/reports?range=month
Returns analytics data. Range: `week|month|quarter|year`

---

## Project Endpoints

### GET /projects
List all accessible projects.

### GET /projects/:id
Get project details with all related reviews and quotations.

### POST /projects
Create new project inquiry. Roles: salesperson, ceo.
```json
{
  "client_name": "ACME Corp",
  "project_description": "HVAC installation",
  "location": "Dubai, UAE",
  "contact_info": { "phone": "+971-xxx", "email": "client@acme.com" }
}
```

### PATCH /projects/:id/status
Update project workflow status.
```json
{
  "status": "qc_review",
  "notes": "Forwarded to QC team"
}
```

---

## QC Endpoints (Role: qc)

### GET /qc/pending
Get projects pending QC review.

### POST /qc/review
Submit QC review.
```json
{
  "inquiry_id": "uuid",
  "checklist": { "documents_complete": true, "specs_clear": true },
  "remarks": "All documents in order",
  "decision": "approved"
}
```

### GET /qc/history/:inquiry_id
Get QC review history for a project.

---

## Technical Endpoints (Role: technical)

### GET /technical/pending
Get projects pending technical review.

### POST /technical/review
Submit technical review.
```json
{
  "inquiry_id": "uuid",
  "system_type": "HVAC - Central Air",
  "feasibility": "feasible",
  "estimated_duration": 45,
  "remarks": "Technically feasible",
  "decision": "approved"
}
```

### GET /technical/system-types
Get list of available system types.

---

## Estimation Endpoints (Role: estimation)

### GET /estimation/pending
Get projects pending estimation.

### POST /estimation/quotation
Submit cost quotation.
```json
{
  "inquiry_id": "uuid",
  "material_cost": 50000,
  "labor_cost": 20000,
  "overhead_percentage": 15,
  "margin_percentage": 20,
  "boq_items": [{ "description": "Item 1", "qty": 10, "unit_price": 500 }]
}
```

---

## CEO Endpoints (Role: ceo)

### GET /ceo/pending
Get projects awaiting CEO approval.

### POST /ceo/approve
Approve/reject/request revision.
```json
{
  "inquiry_id": "uuid",
  "decision": "approved",
  "notes": "Approved as submitted",
  "adjusted_price": null
}
```

### GET /ceo/analytics
Get executive analytics summary.

---

## Notification Endpoints

### GET /notifications
Get user's notifications.

### PATCH /notifications/:id/read
Mark notification as read.

### PATCH /notifications/read-all
Mark all notifications as read.

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |
