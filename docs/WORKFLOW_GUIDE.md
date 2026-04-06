# Workflow Guide

## Overview

The GUTMANN system manages project inquiries through a structured workflow with 7 departments. Each inquiry progresses through defined stages with role-based access controls.

---

## Workflow Stages

```
1. RECEIVED          → Salesperson submits inquiry
2. QC REVIEW         → QC team validates documents
3. QC REVISION       → Salesperson updates after QC rejection
4. TECHNICAL REVIEW  → Technical team evaluates feasibility
5. TECHNICAL REVISION→ Salesperson updates after technical rejection
6. ESTIMATION        → Estimation team creates quotation
7. CEO APPROVAL      → CEO reviews and approves/rejects
8. CLIENT REVIEW     → Client accepts/rejects/negotiates
9. APPROVED          → Project won
10. REJECTED          → Project lost
```

---

## Stage Transition Rules

| From | To | Allowed Roles |
|------|----|---------------|
| received | qc_review | salesperson, ceo |
| qc_review | technical_review | qc, ceo |
| qc_review | qc_revision | qc, ceo |
| qc_revision | qc_review | salesperson, ceo |
| technical_review | estimation | technical, ceo |
| technical_review | technical_revision | technical, ceo |
| technical_revision | technical_review | salesperson, ceo |
| estimation | ceo_approval | estimation, ceo |
| ceo_approval | client_review | ceo |
| ceo_approval | rejected | ceo |
| ceo_approval | estimation | ceo |
| client_review | approved | ceo, salesperson |
| client_review | rejected | ceo, salesperson |
| client_review | ceo_approval | ceo |

---

## SLA Thresholds

| Stage | SLA (hours) |
|-------|------------|
| received | 24 |
| qc_review | 48 |
| qc_revision | 24 |
| technical_review | 72 |
| technical_revision | 48 |
| estimation | 72 |
| ceo_approval | 24 |
| client_review | 120 |

Inquiries exceeding 3 days in any stage are flagged as **bottlenecks**.

---

## Department Responsibilities

### Salesperson
- Create new inquiries
- Respond to QC/Technical revision requests
- Track inquiry progress
- Handle client communication for client_review stage

### QC Department
- Validate inquiry documents and completeness
- Check client information accuracy
- Approve/reject with feedback
- Inquiries appear in queue at `qc_review` status

### Technical Department
- Evaluate technical feasibility
- Define system type and specifications
- Estimate project duration
- Approve/reject with technical notes

### Estimation Department
- Create financial quotations
- Calculate cost estimates and final pricing
- Set validity periods and payment terms
- Submit to CEO for approval

### CEO
- Final approval authority
- Can adjust pricing before client submission
- Can redirect to any previous stage
- Full visibility of all projects and KPIs

### Client
- View submitted quotations
- Accept, reject, or request negotiation
- Counter-offer on pricing

---

## Bottleneck Detection

An inquiry is marked as a bottleneck when:
1. It has been in the same stage for more than 3 days
2. The `bottleneck_flag` field is set to `true`
3. A notification is sent to the CEO and relevant department

CEO dashboard displays all active bottlenecks with stage duration.

---

## Real-time Notifications

The system sends notifications via:
1. **In-app**: Stored in `notifications` table, delivered via Socket.IO
2. **Email**: Sent via configured email service (nodemailer)

### Notification Triggers

| Event | Recipients |
|-------|-----------|
| New inquiry | QC team |
| QC approved | Technical team |
| QC rejected | Salesperson |
| Technical approved | Estimation team |
| Technical rejected | Salesperson |
| Quotation ready | CEO |
| CEO approved | Salesperson + Client |
| CEO rejected | Salesperson |
| Client accepted | CEO + Salesperson |
| Client rejected | CEO + Salesperson |
| Bottleneck detected | CEO |
