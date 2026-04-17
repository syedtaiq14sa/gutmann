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
    : -1;
  const sanitized = { ...inquiry };

  const canSeeQcDetails = role !== 'salesperson' && getStageRank('qc_review') <= cappedRank;
  const canSeeTechnicalDetails = role !== 'salesperson' && getStageRank('technical_review') <= cappedRank;
  const canSeeEstimationDetails = role !== 'salesperson' && getStageRank('estimation') <= cappedRank;

  sanitized.qc_reviews = canSeeQcDetails ? (inquiry.qc_reviews || []) : [];
  sanitized.technical_reviews = canSeeTechnicalDetails ? (inquiry.technical_reviews || []) : [];
  sanitized.quotations = canSeeEstimationDetails ? (inquiry.quotations || []) : [];

  if (Array.isArray(inquiry.project_status)) {
    if (role === 'salesperson') {
      // Sales users retain high-level stage timeline visibility after handoff.
      // Detailed departmental artifacts remain hidden via filtered review/quotation arrays.
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
