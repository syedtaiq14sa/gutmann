const STAGE_ORDER = [
  'received',
  'qc_review',
  'qc_revision',
  'technical_review',
  'technical_revision',
  'estimation',
  'ceo_approval',
  'sales_followup',
  'client_review',
  'approved',
  'supply_chain',
  'rejected'
];

const ROLE_MAX_VISIBLE_STAGE = {
  salesperson: 'received',
  qc: 'qc_review',
  technical: 'technical_review',
  estimation: 'estimation',
  supply_chain: 'supply_chain',
  client: 'client_review'
};

const SALES_EDITABLE_STATUSES = new Set(['received', 'qc_revision', 'technical_revision']);

const getStageRank = (stage) => STAGE_ORDER.indexOf(stage);

const getRoleMaxVisibleRank = (role) => {
  if (role === 'ceo') return Number.POSITIVE_INFINITY;
  const stage = ROLE_MAX_VISIBLE_STAGE[role];
  return getStageRank(stage);
};

const sanitizeInquiryForRole = (inquiry, role) => {
  if (!inquiry || role === 'ceo') return inquiry;

  const currentRank = getStageRank(inquiry.status);
  const roleMaxRank = getRoleMaxVisibleRank(role);
  const cappedRank = currentRank >= 0
    ? Math.min(roleMaxRank, currentRank)
    : roleMaxRank;
  const sanitized = { ...inquiry };

  const canSeeQcDetails = role !== 'salesperson' && getStageRank('qc_review') <= cappedRank;
  const canSeeTechnicalDetails = role !== 'salesperson' && getStageRank('technical_review') <= cappedRank;
  const canSeeEstimationDetails = role !== 'salesperson' && getStageRank('estimation') <= cappedRank;

  sanitized.qc_reviews = canSeeQcDetails ? (inquiry.qc_reviews || []) : [];
  sanitized.technical_reviews = canSeeTechnicalDetails ? (inquiry.technical_reviews || []) : [];
  sanitized.quotations = canSeeEstimationDetails ? (inquiry.quotations || []) : [];

  if (role === 'salesperson' && !SALES_EDITABLE_STATUSES.has(inquiry.status)) {
    sanitized.qc_reviews = [];
    sanitized.technical_reviews = [];
    sanitized.quotations = [];
  }

  if (Array.isArray(inquiry.project_status)) {
    if (role === 'salesperson') {
      sanitized.project_status = inquiry.project_status;
    } else {
      sanitized.project_status = inquiry.project_status.filter((row) => {
        const rank = getStageRank(row.stage);
        return rank !== -1 && rank <= cappedRank;
      });
    }
  } else {
    sanitized.project_status = [];
  }

  return sanitized;
};

module.exports = {
  sanitizeInquiryForRole
};
