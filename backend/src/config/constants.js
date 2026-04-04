// Workflow stages in order
const WORKFLOW_STAGES = [
  'received',
  'qc_review',
  'qc_revision',
  'technical_review',
  'technical_revision',
  'estimation',
  'ceo_approval',
  'client_review',
  'approved',
  'rejected'
];

// SLA thresholds in hours per stage
const SLA_HOURS = {
  received: 24,
  qc_review: 48,
  qc_revision: 24,
  technical_review: 72,
  technical_revision: 48,
  estimation: 72,
  ceo_approval: 24,
  client_review: 120
};

// Bottleneck threshold in days
const BOTTLENECK_THRESHOLD_DAYS = 3;

// Notification types
const NOTIFICATION_TYPES = {
  STAGE_CHANGED: 'stage_changed',
  REVIEW_REQUIRED: 'review_required',
  APPROVAL_REQUIRED: 'approval_required',
  REJECTED: 'rejected',
  APPROVED: 'approved',
  BOTTLENECK: 'bottleneck',
  QUOTATION_READY: 'quotation_ready',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  CLARIFICATION_NEEDED: 'clarification_needed'
};

// User roles
const ROLES = {
  CEO: 'ceo',
  SALESPERSON: 'salesperson',
  QC: 'qc',
  TECHNICAL: 'technical',
  ESTIMATION: 'estimation',
  CLIENT: 'client'
};

// Project status labels for display
const STATUS_LABELS = {
  received: 'Received',
  qc_review: 'QC Review',
  qc_revision: 'QC Revision',
  technical_review: 'Technical Review',
  technical_revision: 'Technical Revision',
  estimation: 'Estimation',
  ceo_approval: 'CEO Approval',
  client_review: 'Client Review',
  approved: 'Approved',
  rejected: 'Rejected'
};

// Email templates
const EMAIL_TEMPLATES = {
  APPROVAL: 'approval',
  REJECTION: 'rejection',
  BOTTLENECK_ALERT: 'bottleneck_alert',
  QUOTATION_READY: 'quotation_ready',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  STAGE_UPDATE: 'stage_update'
};

// Profit margin targets (percentage)
const PROFIT_MARGIN = {
  MIN: 10,
  TARGET: 25,
  MAX: 40
};

module.exports = {
  WORKFLOW_STAGES,
  SLA_HOURS,
  BOTTLENECK_THRESHOLD_DAYS,
  NOTIFICATION_TYPES,
  ROLES,
  STATUS_LABELS,
  EMAIL_TEMPLATES,
  PROFIT_MARGIN
};
