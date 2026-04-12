const WORKFLOW_TRANSITIONS = {
  received: {
    qc_review: ['salesperson', 'ceo']
  },
  qc_review: {
    technical_review: ['qc', 'ceo'],
    sales_followup: ['qc', 'ceo']
  },
  sales_followup: {
    qc_review: ['salesperson', 'ceo'],
    technical_review: ['salesperson', 'ceo'],
    estimation: ['salesperson', 'ceo'],
    ceo_approval: ['salesperson', 'ceo'],
    client_review: ['salesperson', 'ceo']
  },
  technical_review: {
    estimation: ['technical', 'ceo'],
    sales_followup: ['technical', 'ceo']
  },
  estimation: {
    ceo_approval: ['estimation', 'ceo'],
    sales_followup: ['estimation', 'ceo']
  },
  ceo_approval: {
    sales_followup: ['ceo']
  },
  client_review: {
    approved: ['ceo', 'salesperson', 'client'],
    sales_followup: ['ceo', 'salesperson', 'client']
  },
  approved: {
    supply_chain: ['ceo', 'salesperson', 'client']
  }
};

class WorkflowEngine {
  canTransition(currentStatus, newStatus, userRole) {
    const allowedTransitions = WORKFLOW_TRANSITIONS[currentStatus];
    if (!allowedTransitions) return false;

    const allowedRoles = allowedTransitions[newStatus];
    if (!allowedRoles) return false;

    return allowedRoles.includes(userRole);
  }

  getNextStages(currentStatus, userRole) {
    const transitions = WORKFLOW_TRANSITIONS[currentStatus];
    if (!transitions) return [];

    return Object.entries(transitions)
      .filter(([, roles]) => roles.includes(userRole))
      .map(([stage]) => stage);
  }

  getStageOrder() {
    return [
      'received',
      'qc_review',
      'technical_review',
      'estimation',
      'ceo_approval',
      'sales_followup',
      'client_review',
      'approved',
      'supply_chain',
      'rejected'
    ];
  }

  isBottleneck(project, thresholdDays = 3) {
    const stageStart = new Date(project.updated_at || project.created_at);
    const now = new Date();
    const daysDiff = (now - stageStart) / (1000 * 60 * 60 * 24);
    return daysDiff > thresholdDays;
  }
}

module.exports = new WorkflowEngine();
