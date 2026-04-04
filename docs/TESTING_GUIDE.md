# Live Preview Testing Guide

This guide describes how to verify that the deployed Gutmann system is working correctly after setup on Render.com and Supabase.

Replace `gutmann-backend.onrender.com` and `gutmann-frontend.onrender.com` with your actual Render service URLs throughout this document.

---

## 1. Backend Health Check

Confirm the API server is running:

```bash
curl https://gutmann-backend.onrender.com/api/health
```

**Expected response:**
```json
{"status":"ok"}
```

If you receive a connection error, the service may still be starting (free tier cold-start can take ~30 seconds). Retry after 30 seconds.

---

## 2. User Registration

Register a new CEO account via the API:

```bash
curl -X POST https://gutmann-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@gutmann.com",
    "password": "Admin@123",
    "name": "CEO Test",
    "role": "ceo"
  }'
```

**Expected response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "ceo@gutmann.com",
    "name": "CEO Test",
    "role": "ceo"
  }
}
```

If the user was already inserted via the seed script, you may receive a 409 Conflict – that is fine.

---

## 3. User Login & JWT Token

```bash
curl -X POST https://gutmann-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ceo@gutmann.com",
    "password": "Admin@123"
  }'
```

**Expected response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "ceo@gutmann.com",
    "role": "ceo"
  }
}
```

Save the `token` value – you will use it in the next tests.

---

## 4. Authenticated API Call

Test that the JWT token works by fetching the inquiry list:

```bash
TOKEN="<paste your token here>"

curl https://gutmann-backend.onrender.com/api/inquiries \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response (200 OK):**
```json
{
  "inquiries": [],
  "total": 0
}
```

(Empty list is expected on a fresh database.)

---

## 5. Create an Inquiry

```bash
curl -X POST https://gutmann-backend.onrender.com/api/inquiries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "client_name": "Test Client",
    "project_description": "Sample fire suppression project",
    "location": "Dubai, UAE",
    "priority": "medium"
  }'
```

**Expected response (201 Created):**
```json
{
  "inquiry": {
    "id": "...",
    "inquiry_number": "INQ-0001",
    "client_name": "Test Client",
    "status": "received",
    ...
  }
}
```

---

## 6. Frontend Smoke Test

1. Open `https://gutmann-frontend.onrender.com` in your browser.
2. You should see the **Login** page.
3. Enter:
   - **Email**: `ceo@gutmann.com`
   - **Password**: `Admin@123`
4. Click **Sign In**.
5. You should be redirected to the **CEO Dashboard**.

### Page-by-page checklist

| Page | How to reach it | What to verify |
|---|---|---|
| Dashboard | Login as CEO | Widgets load, no console errors |
| Inquiries | Sidebar → Inquiries | List renders, "New Inquiry" button visible |
| New Inquiry form | Click "New Inquiry" | Form fields render, submit creates a record |
| QC Review | Login as `qc@gutmann.com` / `QC@12345` | Pending inquiries visible |
| Technical Review | Login as `tech@gutmann.com` / `Tech@123` | Pending inquiries visible |
| Estimation | Login as `estimation@gutmann.com` / `Est@1234` | Quotation form renders |
| Client Portal | Login as `client@gutmann.com` / `Client@12` | Only client-relevant inquiries visible |
| Notifications | Any role | Bell icon in header shows count |

---

## 7. Role-Based Access Control Test

Verify that lower-privilege roles cannot access restricted pages:

1. Log in as `client@gutmann.com`.
2. Try navigating to `/admin` or `/users`.
3. You should be redirected back to the dashboard or see a 403 / "Access Denied" message.

---

## 8. End-to-End Workflow Test

Follow the full inquiry lifecycle:

1. **Salesperson** creates an inquiry → status: `received`
2. **QC** reviews and approves → status: `qc_review` → `technical_review`
3. **Technical** reviews and approves → status: `technical_review` → `estimation`
4. **Estimation** submits a quotation → status: `estimation` → `ceo_approval`
5. **CEO** approves → status: `ceo_approval` → `client_review`
6. **Client** accepts → status: `client_review` → `approved`

Each step should:
- Update the inquiry status in the database
- Send a notification to the next responsible party
- Appear in the relevant role's dashboard

---

## 9. Performance Baseline

With the Render free tier, expect:
- Cold-start (first request after idle): 10–30 seconds
- Subsequent requests: < 500 ms
- Frontend page load: < 3 seconds (cached assets)

Upgrade to a paid Render plan to eliminate cold-starts in production.
