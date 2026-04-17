import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import QCReviewForm from '../components/Forms/QCReviewForm';
import gutmannLogo from '../assets/gutmann-logo.png';

const WORKFLOW_STAGES = [
  { key: 'qc_review', label: 'QC', topNav: true },
  { key: 'technical_review', label: 'Technical', topNav: true, departmentChecklist: true },
  { key: 'estimation', label: 'Estimation', topNav: true, departmentChecklist: true },
  { key: 'ceo_approval', label: 'CEO Approval', topNav: true, departmentChecklist: true },
  { key: 'sales_followup', label: 'Sales Follow-up', departmentChecklist: true, departmentTitle: 'Feedback to Sales' },
  { key: 'client_review', label: 'Client Approval', departmentChecklist: true },
  { key: 'supply_chain', label: 'Supply Chain', topNav: true }
];

const TOP_NAV_STAGES = WORKFLOW_STAGES.filter(stage => stage.topNav);

const ROLE_STAGE_VISIBILITY = {
  salesperson: [],
  qc: ['qc_review'],
  technical: ['qc_review', 'technical_review'],
  estimation: ['qc_review', 'technical_review', 'estimation'],
  ceo: WORKFLOW_STAGES.map((stage) => stage.key),
  client: ['client_review'],
  supply_chain: ['supply_chain']
};

const ROLE_EDITABLE_WIZARD_STAGES = {
  salesperson: [],
  qc: ['qc_review'],
  technical: ['technical_review'],
  estimation: ['estimation'],
  ceo: ['qc_review', 'technical_review', 'estimation', 'ceo_approval'],
  client: [],
  supply_chain: []
};

const ROLE_ACTIONABLE_STATUSES = {
  salesperson: ['received', 'qc_revision', 'technical_revision', 'sales_followup', 'client_review', 'approved'],
  qc: ['qc_review'],
  technical: ['technical_review'],
  estimation: ['estimation'],
  ceo: ['received', 'qc_review', 'qc_revision', 'technical_review', 'technical_revision', 'estimation', 'ceo_approval', 'sales_followup', 'client_review', 'approved', 'supply_chain', 'rejected'],
  client: ['client_review', 'approved'],
  supply_chain: ['supply_chain']
};

const isStatusActionableForRole = (role, status) => {
  if (!role || !status) return false;
  return (ROLE_ACTIONABLE_STATUSES[role] || []).includes(status);
};

const STAGE_PROGRESS_ORDER = [
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

const SLA_HOURS = {
  qc_review: 48,
  technical_review: 72,
  estimation: 72,
  ceo_approval: 24,
  sales_followup: 48,
  client_review: 120,
  supply_chain: 72
};

const TERMINAL_STATUSES = ['approved', 'rejected', 'supply_chain'];
const PROJECT_VIEW_STORAGE_KEY = 'project-details:last-open';
const COMPLETED_CHECKMARK = '✓';
const VARIANCE_THRESHOLD_PERCENT = 10;
const FOCUS_DELAY_MS = 60;

const getStageDraftStorageKey = (id, status) => `project-stage-draft:${id}:${status || 'unknown'}`;
const getQcModalStorageKey = (id) => `project-qc-modal-open:${id}`;
const getWizardUiStorageKey = (id) => `project-wizard-ui:${id}`;

const BACKEND_STAGE_REQUIREMENTS = {
  technical_review: {
    checklist: [
      { key: 'requirements_reviewed', label: 'Technical requirements reviewed' },
      { key: 'feasibility_checked', label: 'Feasibility assessment completed' },
      { key: 'risk_assessed', label: 'Implementation risks assessed' }
    ],
    requireFeedback: true
  },
  estimation: {
    checklist: [
      { key: 'costing_completed', label: 'Costing sheet completed' },
      { key: 'quotation_reviewed', label: 'Quotation reviewed internally' },
      { key: 'profitability_verified', label: 'Pricing and margin verified' }
    ],
    requireFeedback: true,
    requirePricing: true
  },
  ceo_approval: {
    checklist: [
      { key: 'submission_reviewed', label: 'Submission reviewed' },
      { key: 'commercial_terms_reviewed', label: 'Commercial terms reviewed' }
    ],
    requireFeedback: true
  },
  sales_followup: {
    checklist: [
      { key: 'rejection_feedback_reviewed', label: 'Rejection feedback reviewed' },
      { key: 'followup_plan_prepared', label: 'Follow-up plan prepared' }
    ],
    requireFeedback: true
  },
  client_review: {
    checklist: [
      { key: 'client_response_recorded', label: 'Client response recorded' }
    ],
    requireFeedback: true,
    requireClientResponse: true
  }
};

const STAGE_SUB_STEPS = {
  qc_review: [
    { key: 'inquiry_validation', title: 'Inquiry Validation', description: 'Verify client information, location, and inquiry details.' },
    { key: 'document_checklist', title: 'Document Checklist', description: 'Review required submitted documents and completeness status.' },
    { key: 'risk_flag', title: 'Risk Flag', description: 'Capture risk severity, category, and recommended action.' },
    { key: 'qc_signoff', title: 'QC Sign-off', description: 'Confirm QC review and submit to Technical stage.' }
  ],
  technical_review: [
    { key: 'scope_assessment', title: 'Scope Assessment', description: 'Define scope, work type, complexity, and special conditions.' },
    { key: 'wind_load_check', title: 'Wind Load Check', description: 'Validate wind load assumptions and calculation outcomes.' },
    { key: 'design_proposal', title: 'Design Proposal', description: 'Attach or confirm design package requirements.' },
    { key: 'structural_calculation', title: 'Structural Calculation', description: 'Upload and verify structural calculation documentation.' },
    { key: 'technical_submittal', title: 'Technical Submittal', description: 'Prepare final technical package submission details.' },
    { key: 'technical_signoff', title: 'Technical Sign-off', description: 'Authorize technical package before moving to Estimation.' }
  ],
  estimation: [
    { key: 'cost_breakdown', title: 'Cost Breakdown', description: 'Enter line-by-line cost breakdown and totals.' },
    { key: 'margin_pricing', title: 'Margin & Pricing', description: 'Set margin/discount and derive final selling price.' },
    { key: 'comparison_check', title: 'Comparison Check', description: 'Benchmark estimate against previous project references.' },
    { key: 'vendor_quotations', title: 'Vendor Quotations', description: 'Attach and evaluate supplier quotations.' },
    { key: 'estimation_signoff', title: 'Estimation Sign-off', description: 'Confirm final estimate before CEO Approval.' }
  ],
  ceo_approval: [
    { key: 'summary_review', title: 'Summary Review', description: 'Review key outputs from QC, Technical, and Estimation.' },
    { key: 'commercial_terms', title: 'Commercial Terms', description: 'Review payment, delivery, and contract terms.' },
    { key: 'risk_assessment', title: 'Risk Assessment', description: 'Review flagged risks and mitigation strategy.' },
    { key: 'decision', title: 'Decision', description: 'Approve, request revision, or reject with mandatory remarks.' },
    { key: 'ceo_signoff', title: 'CEO Sign-off', description: 'Finalize and confirm decision with sign-off.' }
  ],
  sales_followup: [
    { key: 'followup', title: 'Feedback to Sales', description: 'Coordinate revision details for Sales follow-up.' }
  ],
  client_review: [
    { key: 'client_decision', title: 'Client Approval', description: 'Capture client response and comments.' }
  ],
  supply_chain: [
    { key: 'handoff', title: 'Supply Chain', description: 'Review handoff timeline and completion records.' }
  ]
};

const DEPARTMENT_CHECKLIST_CARDS = WORKFLOW_STAGES
  .filter(stage => stage.departmentChecklist && BACKEND_STAGE_REQUIREMENTS[stage.key])
  .map(stage => ({ key: stage.key, title: stage.departmentTitle || stage.label }));

function GutmannLogo({ compact = false }) {
  return (
    <div className={`gutmann-logo${compact ? ' compact' : ''}`} aria-label="Gutmann">
      <img className="gutmann-logo-image" src={gutmannLogo} alt="Gutmann logo" />
    </div>
  );
}

const createInitialSubStepState = () =>
  WORKFLOW_STAGES.reduce((acc, stage) => {
    acc[stage.key] = 0;
    return acc;
  }, {});

const clampSubStepIndex = (stageKey, index) => {
  const maxIndex = (STAGE_SUB_STEPS[stageKey]?.length || 1) - 1;
  return Math.min(Math.max(index, 0), Math.max(maxIndex, 0));
};

const getSubStepState = (stageState, index, activeIndex) => {
  if (stageState === 'completed') return 'completed';
  if (stageState === 'pending') return 'pending';
  if (index < activeIndex) return 'completed';
  if (index === activeIndex) return 'active';
  return 'pending';
};

const createStageInputState = (status) => {
  if (status === 'qc_review') {
    return {
      checklist: {},
      feedback: '',
      estimated_cost: '',
      final_price: '',
      client_response: '',
      decision: '',
      documents: {
        technical_drawing: { status: 'missing', link: '', remarks: '' },
        boq: { status: 'missing', link: '', remarks: '' },
        spec_sheet: { status: 'missing', link: '', remarks: '' },
        client_po: { status: 'n_a', link: '', remarks: '' },
        site_photos: { status: 'n_a', link: '', remarks: '' }
      },
      qcRisk: {
        severity: 'none',
        category: '',
        description: '',
        action: '',
        raised_by_name: '',
        raised_by_designation: ''
      },
      qcSignoff: {
        reviewer_name: '',
        designation: '',
        date: new Date().toISOString().slice(0, 10),
        acknowledged: false
      }
    };
  }
  if (status === 'technical_review') {
    return {
      checklist: {},
      feedback: '',
      estimated_cost: '',
      final_price: '',
      client_response: '',
      decision: '',
      scope: {
        description: '',
        work_type: '',
        complexity: '',
        duration: '',
        site_visit_required: 'no',
        special_conditions: ''
      },
      wind: {
        location_zone: '',
        wind_speed: '',
        code_used: '',
        wind_pressure: '',
        result_status: '',
        upload: '',
        remarks: ''
      },
      design: {
        new_design_required: 'no',
        title: '',
        description: '',
        upload: '',
        revision: '',
        prepared_by_name: '',
        prepared_by_designation: ''
      },
      structural: {
        reference_number: '',
        method: '',
        software: '',
        upload: '',
        verified_by_name: '',
        verified_by_designation: '',
        verified_by_company: '',
        verification_status: ''
      },
      submittal: {
        title: '',
        submitted_by_name: '',
        submitted_by_designation: '',
        date: new Date().toISOString().slice(0, 10),
        remarks: '',
        additional_upload: ''
      },
      technicalSignoff: {
        authorized_name: '',
        designation: '',
        department: '',
        date: new Date().toISOString().slice(0, 10),
        acknowledged: false
      }
    };
  }
  if (status === 'estimation') {
    return {
      checklist: {},
      feedback: '',
      estimated_cost: '',
      final_price: '',
      client_response: '',
      decision: '',
      costRows: [
        { description: '', category: 'material', quantity: '', unit: 'm²', unit_cost: '' }
      ],
      margin: {
        profit_margin: '',
        discount: '',
        currency: 'SAR',
        notes: '',
        validity_date: ''
      },
      comparisonRows: [{ project_name: '', year: '', original_cost: '', remarks: '' }],
      vendorRows: [{ vendor_name: '', reference: '', amount: '', validity_date: '', upload: '', selected: false, remarks: '' }],
      estimationSignoff: {
        estimated_by_name: '',
        designation: '',
        department: '',
        date: new Date().toISOString().slice(0, 10),
        acknowledged: false
      }
    };
  }
  if (status === 'ceo_approval') {
    return {
      checklist: {},
      feedback: '',
      estimated_cost: '',
      final_price: '',
      client_response: '',
      decision: '',
      commercialTerms: {
        payment_terms: '',
        milestone_breakdown: '',
        delivery_timeline_weeks: '',
        warranty_terms: '',
        contract_type: '',
        special_conditions: '',
        client_po_reference: ''
      },
      ceoRisk: {
        mitigation: '',
        tolerance: 'mitigate',
        overall_rating: '',
        remarks: ''
      },
      ceoDecision: {
        decision: '',
        revision_required_from: '',
        revision_instructions: '',
        return_deadline: '',
        rejection_reason: '',
        rejection_remarks: '',
        mandatory_remarks: ''
      },
      ceoSignoff: {
        approved_by_name: '',
        designation: '',
        date: new Date().toISOString().slice(0, 10),
        signature: '',
        acknowledged: false
      }
    };
  }
  if (status === 'client_review') {
    return {
      checklist: { client_response_recorded: false },
      feedback: '',
      estimated_cost: '',
      final_price: '',
      client_response: '',
      decision: ''
    };
  }
  return {
    checklist: {},
    feedback: '',
    estimated_cost: '',
    final_price: '',
    client_response: '',
    decision: ''
  };
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const formatDuration = (start, end) => {
  if (!start) return '—';
  const from = new Date(start).getTime();
  const to = new Date(end || Date.now()).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return '—';
  if (to < from) {
    console.warn('Invalid duration range detected', { start, end });
    return '—';
  }
  const mins = Math.floor((to - from) / (1000 * 60));
  const days = Math.floor(mins / (60 * 24));
  const hours = Math.floor((mins % (60 * 24)) / 60);
  const minutes = mins % 60;
  const chunks = [];
  if (days) chunks.push(`${days}d`);
  if (hours) chunks.push(`${hours}h`);
  chunks.push(`${minutes}m`);
  return chunks.join(' ');
};

const getSlaClass = (stage, startedAt, completedAt) => {
  const limit = SLA_HOURS[stage];
  if (!limit || !startedAt) return 'on-time';
  const elapsedHours = (new Date(completedAt || Date.now()) - new Date(startedAt)) / (1000 * 60 * 60);
  if (elapsedHours > limit) return 'overdue';
  if (elapsedHours >= limit * 0.8) return 'near-deadline';
  return 'on-time';
};

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [project, setProject] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingToQC, setSendingToQC] = useState(false);
  const [movingNext, setMovingNext] = useState(false);
  const [showQCReviewForm, setShowQCReviewForm] = useState(false);
  const [stageInput, setStageInput] = useState(createStageInputState());
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedStageKey, setSelectedStageKey] = useState('');
  const [selectedSubStepByStage, setSelectedSubStepByStage] = useState(createInitialSubStepState());
  const [expandedPreviousStages, setExpandedPreviousStages] = useState({});
  const checklistRef = useRef(null);
  const estimatedCostRef = useRef(null);
  const finalPriceRef = useRef(null);
  const clientResponseRef = useRef(null);
  const feedbackRef = useRef(null);
  const scopeDescriptionRef = useRef(null);
  const scopeWorkTypeRef = useRef(null);
  const scopeComplexityRef = useRef(null);
  const scopeSpecialConditionsRef = useRef(null);
  const windResultStatusRef = useRef(null);
  const windRemarksRef = useRef(null);
  const structuralVerificationStatusRef = useRef(null);
  const technicalSignoffRef = useRef(null);
  const technicalSignoffAuthorizedNameRef = useRef(null);
  const technicalSignoffDesignationRef = useRef(null);
  const technicalSignoffDepartmentRef = useRef(null);
  const technicalSignoffAcknowledgedRef = useRef(null);
  const technicalFeedbackRef = useRef(null);
  const previousStatusRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowQCReviewForm(false);
    };
    if (showQCReviewForm) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQCReviewForm]);

  const fetchAll = async () => {
    try {
      const [projectRes, historyRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/inquiries/${id}/history`)
      ]);
      setProject(projectRes.data);
      setHistory(historyRes.data || []);
      return projectRes.data;
    } catch (err) {
      throw new Error(err?.response?.data?.error || 'Failed to fetch project timeline data');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAll();
      } catch (err) {
        console.error('Failed to load project details:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const defaultState = createStageInputState(project?.status);
    if (!id || !project?.status) {
      setStageInput(defaultState);
      setValidationErrors({});
      return;
    }
    try {
      const saved = localStorage.getItem(getStageDraftStorageKey(id, project.status));
      if (!saved) {
        setStageInput(defaultState);
        setValidationErrors({});
        return;
      }
      const parsed = JSON.parse(saved);
      setStageInput({
        ...defaultState,
        ...parsed,
        checklist: {
          ...defaultState.checklist,
          ...(parsed?.checklist || {})
        }
      });
      setValidationErrors({});
    } catch (err) {
      console.warn('Failed to restore stage draft:', err);
      setStageInput(defaultState);
      setValidationErrors({});
    }
  }, [id, project?.status]);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem(PROJECT_VIEW_STORAGE_KEY, id);
  }, [id]);

  useEffect(() => {
    if (!id || !project?.status) return;
    localStorage.setItem(getStageDraftStorageKey(id, project.status), JSON.stringify(stageInput));
  }, [id, project?.status, stageInput]);

  useEffect(() => {
    if (!id || !project?.status) return;
    const defaults = createInitialSubStepState();
    const activeStage = WORKFLOW_STAGES.find(stage => stage.key === project.status)?.key || WORKFLOW_STAGES[0].key;
    try {
      const saved = localStorage.getItem(getWizardUiStorageKey(id));
      if (!saved) {
        setSelectedStageKey(activeStage);
        setSelectedSubStepByStage(defaults);
        return;
      }
      const parsed = JSON.parse(saved);
      const hydratedSubSteps = { ...defaults };
      Object.keys(hydratedSubSteps).forEach((stageKey) => {
        const requested = Number(parsed?.selectedSubStepByStage?.[stageKey]);
        hydratedSubSteps[stageKey] = Number.isFinite(requested)
          ? clampSubStepIndex(stageKey, requested)
          : 0;
      });
      setSelectedStageKey(activeStage);
      setSelectedSubStepByStage(hydratedSubSteps);
    } catch (err) {
      console.warn('Failed to restore wizard UI state:', err);
      setSelectedStageKey(activeStage);
      setSelectedSubStepByStage(defaults);
    }
  }, [id, project?.status]);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem(getWizardUiStorageKey(id), JSON.stringify({
      selectedSubStepByStage
    }));
  }, [id, selectedSubStepByStage]);

  useEffect(() => {
    if (!project?.status) return;
    const previousStatus = previousStatusRef.current;
    const shouldResetOnStageChange = Boolean(previousStatus && previousStatus !== project.status);
    setSelectedStageKey(project.status);
    setSelectedSubStepByStage((prev) => {
      const requested = Number(prev[project.status]);
      const nextIndex = shouldResetOnStageChange
        ? 0
        : Number.isFinite(requested)
          ? clampSubStepIndex(project.status, requested)
          : 0;
      if (prev[project.status] === nextIndex) return prev;
      return { ...prev, [project.status]: nextIndex };
    });
    previousStatusRef.current = project.status;
  }, [project?.status]);

  useEffect(() => {
    setExpandedPreviousStages({});
  }, [id, project?.status]);

  useEffect(() => {
    if (!id) return;
    const canReviewQc = user?.role === 'qc' && project?.status === 'qc_review';
    if (!canReviewQc) {
      setShowQCReviewForm(false);
      return;
    }
    const storedValue = localStorage.getItem(getQcModalStorageKey(id));
    setShowQCReviewForm(storedValue === '1');
  }, [id, user?.role, project?.status]);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem(getQcModalStorageKey(id), showQCReviewForm ? '1' : '0');
  }, [id, showQCReviewForm]);

  const stageRecords = useMemo(() => {
    const rows = project?.project_status || [];
    return WORKFLOW_STAGES.reduce((acc, stage) => {
      const row = rows
        .filter(item => item.stage === stage.key)
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
      acc[stage.key] = row || null;
      return acc;
    }, {});
  }, [project?.project_status]);

  const handleSendToQC = async () => {
    setSendingToQC(true);
    setError('');
    try {
      await api.put(`/inquiries/${id}/stage`, { new_status: 'qc_review', feedback: 'Submitted by salesperson' });
      const updatedProject = await fetchAll();
      if (!isStatusActionableForRole(user?.role, updatedProject?.status || 'qc_review')) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send to QC');
    } finally {
      setSendingToQC(false);
    }
  };

  const getNextAction = () => {
    if (!user?.role || !project?.status) return null;
    const stageActions = {
      technical_review: { nextStatus: 'estimation', roles: ['technical'] },
      estimation: { nextStatus: 'ceo_approval', roles: ['estimation'] },
      ceo_approval: { nextStatus: 'client_review', roles: ['ceo'] },
      sales_followup: { nextStatus: 'client_review', roles: ['salesperson', 'ceo'] },
      client_review: { nextStatus: 'approved', roles: ['client', 'salesperson', 'ceo'] },
      approved: { nextStatus: 'supply_chain', roles: ['ceo', 'salesperson', 'client'] }
    };
    const action = stageActions[project.status];
    if (!action || !action.roles.includes(user.role)) return null;
    return action;
  };

  const moveStage = async (nextStatus, extraPayload = {}) => {
    const draftKey = getStageDraftStorageKey(id, project?.status);
    const estimatedCostValue = stageInput.estimated_cost === '' ? null : Number(stageInput.estimated_cost);
    const finalPriceValue = stageInput.final_price === '' ? null : Number(stageInput.final_price);
    setMovingNext(true);
    setError('');
    try {
      await api.put(`/inquiries/${id}/stage`, {
        new_status: nextStatus,
        checklist: stageInput.checklist,
        feedback: stageInput.feedback,
        estimated_cost: Number.isFinite(estimatedCostValue) ? estimatedCostValue : null,
        final_price: Number.isFinite(finalPriceValue) ? finalPriceValue : null,
        client_response: stageInput.client_response,
        decision: stageInput.decision || null,
        ...extraPayload
      });
      const updatedProject = await fetchAll();
      localStorage.removeItem(draftKey);
      setValidationErrors({});
      if (!isStatusActionableForRole(user?.role, updatedProject?.status || nextStatus)) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move to next stage');
    } finally {
      setMovingNext(false);
    }
  };

  const focusAndScrollToField = (fieldName) => {
    const fieldRefs = {
      checklist: checklistRef,
      estimated_cost: estimatedCostRef,
      final_price: finalPriceRef,
      client_response: clientResponseRef,
      feedback: feedbackRef,
      technical_signoff: technicalSignoffRef,
      technical_scope_description: scopeDescriptionRef,
      technical_scope_work_type: scopeWorkTypeRef,
      technical_scope_complexity: scopeComplexityRef,
      technical_wind_result_status: windResultStatusRef,
      technical_structural_verification_status: structuralVerificationStatusRef,
      technical_signoff_authorized_name: technicalSignoffAuthorizedNameRef,
      technical_signoff_designation: technicalSignoffDesignationRef,
      technical_signoff_department: technicalSignoffDepartmentRef,
      technical_signoff_acknowledged: technicalSignoffAcknowledgedRef,
      technical_feedback: technicalFeedbackRef
    };
    const target = fieldRefs[fieldName]?.current;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') {
      target.focus();
    }
  };

  const validateStageAction = (mode = 'full') => {
    const errors = {};
    let firstInvalidMeta = null;
    const setValidationError = (field, message, meta = {}) => {
      if (!errors[field]) errors[field] = message;
      if (!firstInvalidMeta) firstInvalidMeta = { field, message, ...meta };
    };
    const requirement = BACKEND_STAGE_REQUIREMENTS[project?.status];
    const derived = buildStagePayload();
    const effectiveChecklist = Object.keys(derived?.checklist || {}).length > 0
      ? derived.checklist
      : stageInput.checklist;
    const effectiveFeedback = typeof derived?.feedback === 'string'
      ? derived.feedback
      : stageInput.feedback;
    const effectiveEstimatedCost = derived?.estimated_cost ?? stageInput.estimated_cost;
    const effectiveFinalPrice = derived?.final_price ?? stageInput.final_price;

    const isTechnicalFullValidation = project?.status === 'technical_review' && mode !== 'feedbackOnly';

    if (requirement) {
      const checklistValid = requirement.checklist.every(item => effectiveChecklist[item.key]);
      const feedbackValid = String(effectiveFeedback || '').trim().length > 0;
      const estimatedCostNumber = Number(effectiveEstimatedCost);
      const finalPriceNumber = Number(effectiveFinalPrice);

      if (mode !== 'feedbackOnly' && !checklistValid && project?.status !== 'technical_review') {
        errors.checklist = 'Please complete all checklist items.';
      }

      if ((requirement.requireFeedback || mode === 'feedbackOnly') && !feedbackValid && project?.status !== 'technical_review') {
        errors.feedback = 'This field is required.';
      }

      if (mode !== 'feedbackOnly' && requirement.requirePricing) {
        if (!Number.isFinite(estimatedCostNumber) || estimatedCostNumber <= 0) {
          setValidationError('estimated_cost', 'Enter a valid value greater than 0.');
        }
        if (!Number.isFinite(finalPriceNumber) || finalPriceNumber <= 0) {
          setValidationError('final_price', 'Enter a valid value greater than 0.');
        }
      }

      if (mode !== 'feedbackOnly' && requirement.requireClientResponse && !stageInput.client_response.trim()) {
        setValidationError('client_response', 'This field is required.');
      }
    }

    if (project?.status === 'qc_review' && mode !== 'feedbackOnly') {
      if (!stageInput.qcSignoff?.reviewer_name?.trim()) setValidationError('qc_signoff', 'Reviewer name is required.');
      if (!stageInput.qcSignoff?.designation?.trim()) setValidationError('qc_signoff', 'Designation is required.');
      if (!stageInput.qcSignoff?.acknowledged) setValidationError('qc_signoff', 'Acknowledgement is required.');
      if (!stageInput.qcRisk?.category) setValidationError('qc_risk', 'Risk category is required.');
    }

    if (project?.status === 'technical_review' && mode !== 'feedbackOnly') {
      const technicalRequiredFields = [
        {
          key: 'technical_scope_description',
          valid: Boolean(stageInput.scope?.description?.trim()),
          message: 'Project scope description is required.',
          subStepKey: 'scope_assessment'
        },
        {
          key: 'technical_scope_work_type',
          valid: Boolean(stageInput.scope?.work_type),
          message: 'Work type is required.',
          subStepKey: 'scope_assessment'
        },
        {
          key: 'technical_scope_complexity',
          valid: Boolean(stageInput.scope?.complexity),
          message: 'Technical complexity rating is required.',
          subStepKey: 'scope_assessment'
        },
        {
          key: 'technical_wind_result_status',
          valid: Boolean(stageInput.wind?.result_status),
          message: 'Wind load result status is required.',
          subStepKey: 'wind_load_check'
        },
        {
          key: 'technical_structural_verification_status',
          valid: Boolean(stageInput.structural?.verification_status),
          message: 'Structural verification status is required.',
          subStepKey: 'structural_calculation'
        },
        {
          key: 'technical_signoff_authorized_name',
          valid: Boolean(stageInput.technicalSignoff?.authorized_name?.trim()),
          message: 'Technical sign-off authorized by name is required.',
          subStepKey: 'technical_signoff'
        },
        {
          key: 'technical_signoff_designation',
          valid: Boolean(stageInput.technicalSignoff?.designation),
          message: 'Technical sign-off designation is required.',
          subStepKey: 'technical_signoff'
        },
        {
          key: 'technical_signoff_department',
          valid: Boolean(stageInput.technicalSignoff?.department?.trim()),
          message: 'Technical sign-off department is required.',
          subStepKey: 'technical_signoff'
        },
        {
          key: 'technical_signoff_acknowledged',
          valid: Boolean(stageInput.technicalSignoff?.acknowledged),
          message: 'Technical sign-off acknowledgement is required.',
          subStepKey: 'technical_signoff'
        }
      ];

      if ((requirement?.requireFeedback || mode === 'feedbackOnly') && !String(effectiveFeedback || '').trim()) {
        technicalRequiredFields.push({
          key: 'technical_feedback',
          valid: false,
          message: 'Submittal remarks are required.',
          subStepKey: 'technical_submittal'
        });
      }

      const firstMissingTechnicalField = technicalRequiredFields.find((field) => !field.valid);
      if (firstMissingTechnicalField) {
        const technicalSubSteps = STAGE_SUB_STEPS.technical_review || [];
        const targetIndex = technicalSubSteps.findIndex((step) => step.key === firstMissingTechnicalField.subStepKey);
        if (targetIndex >= 0) {
          setSelectedStageKey('technical_review');
          updateSubStepIndex('technical_review', targetIndex);
        }
        errors[firstMissingTechnicalField.key] = firstMissingTechnicalField.message;
      }
    }

    if (project?.status === 'estimation' && mode !== 'feedbackOnly') {
      const signoff = stageInput.estimationSignoff || {};
      if (!signoff.estimated_by_name?.trim()) setValidationError('estimation_signoff', 'Estimator full name is required.');
      if (!signoff.designation) setValidationError('estimation_signoff', 'Estimator designation is required.');
      if (!signoff.department?.trim()) setValidationError('estimation_signoff', 'Estimator department is required.');
      if (!signoff.acknowledged) setValidationError('estimation_signoff', 'Estimation acknowledgement is required.');
    }

    if (project?.status === 'ceo_approval' && mode !== 'feedbackOnly') {
      const decision = stageInput.ceoDecision || {};
      const signoff = stageInput.ceoSignoff || {};
      if (!decision.decision) setValidationError('ceo_decision', 'Decision selection is required.');
      if (!decision.mandatory_remarks?.trim()) setValidationError('ceo_decision', 'Mandatory remarks are required.');
      if (!signoff.approved_by_name?.trim()) setValidationError('ceo_signoff', 'CEO sign-off full name is required.');
      if (!signoff.designation) setValidationError('ceo_signoff', 'CEO sign-off designation is required.');
      if (!signoff.acknowledged) setValidationError('ceo_signoff', 'CEO sign-off acknowledgement is required.');
    }

    if (firstInvalidMeta?.message) {
      errors._summary = firstInvalidMeta.message;
    }
    setValidationErrors(errors);
    const firstInvalidField = [
      'technical_scope_description',
      'technical_scope_work_type',
      'technical_scope_complexity',
      'technical_wind_result_status',
      'technical_structural_verification_status',
      'technical_feedback',
      'technical_signoff_authorized_name',
      'technical_signoff_designation',
      'technical_signoff_department',
      'technical_signoff_acknowledged',
      'checklist',
      'estimated_cost',
      'final_price',
      'client_response',
      'feedback',
      'qc_signoff',
      'qc_risk',
      'technical_signoff',
      'estimation_signoff',
      'ceo_decision',
      'ceo_signoff'
    ]
      .find((field) => errors[field]);
    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        focusAndScrollToField(firstInvalidField);
      });
      return false;
    }
    return true;
  };

  const getEstimationTotalCost = () => (stageInput.costRows || []).reduce((sum, row) => {
    const quantity = Number(row.quantity);
    const unitCost = Number(row.unit_cost);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) return sum;
    return sum + (quantity * unitCost);
  }, 0);

  const getFinalSellingPrice = () => {
    const totalCost = getEstimationTotalCost();
    const marginPct = Number(stageInput.margin?.profit_margin || 0);
    const discountPct = Number(stageInput.margin?.discount || 0);
    if (!Number.isFinite(totalCost)) return 0;
    const withMargin = totalCost * (1 + ((Number.isFinite(marginPct) ? marginPct : 0) / 100));
    const withDiscount = withMargin * (1 - ((Number.isFinite(discountPct) ? discountPct : 0) / 100));
    return Number.isFinite(withDiscount) ? withDiscount : 0;
  };

  const buildStagePayload = () => {
    if (project?.status === 'technical_review') {
      const checklist = {
        requirements_reviewed: Boolean(stageInput.scope?.description?.trim() && stageInput.scope?.work_type && stageInput.scope?.complexity),
        feasibility_checked: Boolean(stageInput.wind?.result_status && stageInput.structural?.verification_status),
        risk_assessed: Boolean((stageInput.submittal?.remarks || stageInput.wind?.remarks || '').trim() || stageInput.scope?.special_conditions?.trim())
      };
      return {
        checklist,
        feedback: stageInput.submittal?.remarks || stageInput.wind?.remarks || stageInput.scope?.special_conditions || '',
        decision: 'approved'
      };
    }

    if (project?.status === 'estimation') {
      const totalCost = getEstimationTotalCost();
      const finalSellingPrice = getFinalSellingPrice();
      const checklist = {
        costing_completed: (stageInput.costRows || []).some((row) => row.description?.trim() && Number(row.quantity) > 0 && Number(row.unit_cost) > 0),
        quotation_reviewed: (stageInput.vendorRows || []).some((row) => row.vendor_name?.trim() && Number(row.amount) > 0),
        profitability_verified: stageInput.margin?.profit_margin !== '' && Number(stageInput.margin?.profit_margin) >= 0
      };
      return {
        checklist,
        feedback: stageInput.margin?.notes || '',
        estimated_cost: totalCost > 0 ? totalCost : '',
        final_price: finalSellingPrice > 0 ? finalSellingPrice : '',
        decision: 'approved'
      };
    }

    if (project?.status === 'ceo_approval') {
      const decision = stageInput.ceoDecision?.decision || '';
      const checklist = {
        submission_reviewed: true,
        commercial_terms_reviewed: Boolean(stageInput.commercialTerms?.payment_terms && stageInput.commercialTerms?.contract_type)
      };
      return {
        checklist,
        feedback: stageInput.ceoDecision?.mandatory_remarks || '',
        decision
      };
    }

    if (project?.status === 'qc_review') {
      return {
        checklist: {
          documents_complete: Object.values(stageInput.documents || {}).length > 0
            && Object.values(stageInput.documents || {}).every((doc) => doc.status === 'received' || doc.status === 'n_a'),
          site_survey_required: Boolean(stageInput.documents?.site_photos?.status === 'missing'),
          client_info_verified: Boolean(project?.client_name && project?.location && (project?.client_email || project?.client_phone)),
          scope_clear: Boolean(project?.project_type && project?.project_description)
        },
        feedback: stageInput.qcRisk?.description || '',
        decision: 'approved'
      };
    }

    return {};
  };

  const handleActionClick = (nextStatus, extraPayload = {}, mode = 'full') => {
    if (!validateStageAction(mode)) return;
    moveStage(nextStatus, { ...buildStagePayload(), ...extraPayload });
  };

  const clearValidationError = (field) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      delete updated._summary;
      return updated;
    });
  };

  const nextAction = getNextAction();
  const stageRequirements = BACKEND_STAGE_REQUIREMENTS[project?.status];
  const canActOnStage = Boolean(nextAction || (project?.status === 'ceo_approval' && user?.role === 'ceo'));
  const allowedStagesForUser = useMemo(() => {
    const visibleStages = ROLE_STAGE_VISIBILITY[user?.role];
    if (!visibleStages) return [];
    return visibleStages;
  }, [user?.role]);
  const roleVisibleStageSet = useMemo(() => new Set(allowedStagesForUser), [allowedStagesForUser]);
  const allowedTopNavStages = useMemo(
    () => TOP_NAV_STAGES.filter((stage) => roleVisibleStageSet.has(stage.key)),
    [roleVisibleStageSet]
  );
  const activeEditableStage = useMemo(() => {
    const editableWizardStages = ROLE_EDITABLE_WIZARD_STAGES[user?.role] || [];
    return editableWizardStages.includes(project?.status) ? project?.status : null;
  }, [project?.status, user?.role]);
  const showActiveStageWizard = Boolean(activeEditableStage);

  const currentRank = STAGE_PROGRESS_ORDER.indexOf(project?.status);
  const topNavRanks = allowedTopNavStages.map(stage => STAGE_PROGRESS_ORDER.indexOf(stage.key));
  const getTopNavStageState = (stage, index) => {
    // Rejected projects intentionally stop before supply-chain handoff in this UI.
    if (project?.status === 'rejected') {
      return stage.key === 'supply_chain' ? 'pending' : 'completed';
    }
    const stageRank = STAGE_PROGRESS_ORDER.indexOf(stage.key);
    const nextAnchor = topNavRanks[index + 1] ?? Number.POSITIVE_INFINITY;
    if (stage.key === 'supply_chain') {
      if (currentRank > stageRank) return 'completed';
      if (currentRank === stageRank) return 'active';
      return 'pending';
    }
    if (currentRank >= nextAnchor) return 'completed';
    if (currentRank >= stageRank) return 'active';
    return 'pending';
  };

  const viewedStageKey = activeEditableStage || project?.status || selectedStageKey || WORKFLOW_STAGES[0].key;
  const viewedStage = WORKFLOW_STAGES.find(stage => stage.key === viewedStageKey);
  const viewedStageRank = STAGE_PROGRESS_ORDER.indexOf(viewedStageKey);
  const viewedStageState = viewedStageRank < currentRank ? 'completed' : viewedStageRank === currentRank ? 'active' : 'pending';
  const viewedSubSteps = showActiveStageWizard ? (STAGE_SUB_STEPS[viewedStageKey] || []) : [];
  const selectedSubStepIndex = clampSubStepIndex(viewedStageKey, selectedSubStepByStage[viewedStageKey] ?? 0);
  const selectedSubStep = viewedSubSteps[selectedSubStepIndex] || null;
  const stageNumber = Math.max(WORKFLOW_STAGES.findIndex(stage => stage.key === viewedStageKey) + 1, 1);
  const isViewingActiveWorkflowStage = viewedStageKey === project?.status && showActiveStageWizard;
  const isLastViewedSubStep = selectedSubStepIndex >= viewedSubSteps.length - 1;
  const shouldSubmitTechnicalStage = Boolean(
    isViewingActiveWorkflowStage
    && viewedStageKey === 'technical_review'
    && user?.role === 'technical'
    && isLastViewedSubStep
  );
  const handleSubStepPrimaryAction = () => {
    if (shouldSubmitTechnicalStage) {
      handleActionClick('estimation');
      return;
    }
    handleSubStepSelect(selectedSubStepIndex + 1);
  };
  const isCustomStage = ['qc_review', 'technical_review', 'estimation', 'ceo_approval'].includes(viewedStageKey);
  const shouldShowStageForm = Boolean(showActiveStageWizard && isViewingActiveWorkflowStage && canActOnStage && stageRequirements);
  const quotation = project?.quotation || project?.quotations?.[0];
  const overallTurnaroundEnd = TERMINAL_STATUSES.includes(project?.status) ? project?.updated_at : null;
  const previousWorkflowStages = useMemo(() => WORKFLOW_STAGES.filter((stage) => {
    const stageRank = STAGE_PROGRESS_ORDER.indexOf(stage.key);
    return stageRank !== -1 && stageRank < currentRank && roleVisibleStageSet.has(stage.key);
  }), [currentRank, roleVisibleStageSet]);
  const completedTransitionsByStage = useMemo(() => history.reduce((acc, item) => {
    if (item.action !== 'stage_changed') return acc;
    const stageKey = item.details?.from;
    if (!stageKey) return acc;
    acc[stageKey] = item;
    return acc;
  }, {}), [history]);
  const latestQcReview = useMemo(() => (project?.qc_reviews || []).reduce((latest, review) => {
    if (!latest) return review;
    return new Date(review.created_at) > new Date(latest.created_at) ? review : latest;
  }, null), [project?.qc_reviews]);
  const latestTechnicalReview = useMemo(() => (project?.technical_reviews || []).reduce((latest, review) => {
    if (!latest) return review;
    return new Date(review.created_at) > new Date(latest.created_at) ? review : latest;
  }, null), [project?.technical_reviews]);

  const renderPreviousStageDetails = (stageKey) => {
    const record = stageRecords[stageKey];
    const transition = completedTransitionsByStage[stageKey];
    const notes = transition?.details?.feedback || transition?.details?.notes || transition?.details?.message || transition?.details?.reason || 'No notes provided';

    if (stageKey === 'qc_review') {
      return (
        <div className="wizard-summary-grid secondary">
          <div className="wizard-summary-item"><span>QC Decision</span><strong>{latestQcReview?.decision || transition?.details?.decision || '—'}</strong></div>
          <div className="wizard-summary-item"><span>QC Notes</span><strong>{latestQcReview?.notes || notes}</strong></div>
          <div className="wizard-summary-item"><span>Completed At</span><strong>{formatDateTime(record?.completed_at || transition?.created_at)}</strong></div>
        </div>
      );
    }

    if (stageKey === 'technical_review') {
      return (
        <div className="wizard-summary-grid secondary">
          <div className="wizard-summary-item"><span>Technical Decision</span><strong>{latestTechnicalReview?.decision || transition?.details?.decision || '—'}</strong></div>
          <div className="wizard-summary-item"><span>Technical Notes</span><strong>{latestTechnicalReview?.notes || notes}</strong></div>
          <div className="wizard-summary-item"><span>Completed At</span><strong>{formatDateTime(record?.completed_at || transition?.created_at)}</strong></div>
        </div>
      );
    }

    if (stageKey === 'estimation') {
      return (
        <div className="wizard-summary-grid secondary">
          <div className="wizard-summary-item"><span>Estimated Cost</span><strong>${quotation?.estimated_cost?.toLocaleString() || 0}</strong></div>
          <div className="wizard-summary-item"><span>Final Price</span><strong>${quotation?.final_price?.toLocaleString() || 0}</strong></div>
          <div className="wizard-summary-item"><span>Notes</span><strong>{notes}</strong></div>
        </div>
      );
    }

    return (
      <div className="wizard-summary-grid secondary">
        <div className="wizard-summary-item"><span>Status</span><strong>{record?.completed_at ? 'Completed' : 'Recorded'}</strong></div>
        <div className="wizard-summary-item"><span>Completed At</span><strong>{formatDateTime(record?.completed_at || transition?.created_at)}</strong></div>
        <div className="wizard-summary-item"><span>Notes</span><strong>{notes}</strong></div>
      </div>
    );
  };
  const getChecklistState = (stageKey, itemKey) => {
    if (stageKey === project?.status) {
      return Boolean(stageInput.checklist[itemKey]);
    }
    const stageRank = STAGE_PROGRESS_ORDER.indexOf(stageKey);
    if (stageRank !== -1 && stageRank < currentRank) {
      return true;
    }
    return false;
  };

  const updateSubStepIndex = (stageKey, nextIndex) => {
    setSelectedSubStepByStage((prev) => {
      const clamped = clampSubStepIndex(stageKey, nextIndex);
      if (prev[stageKey] === clamped) return prev;
      return { ...prev, [stageKey]: clamped };
    });
  };

  const handleCurrentStageSelect = () => {
    setSelectedStageKey(project.status);
    updateSubStepIndex(project.status, selectedSubStepByStage[project.status] ?? 0);
  };

  const handleSubStepSelect = (index) => {
    if (viewedStageState === 'pending') return;
    updateSubStepIndex(viewedStageKey, index);
  };

  const renderCustomStageContent = () => {
    if (viewedStageKey === 'qc_review') {
      if (selectedSubStep?.key === 'inquiry_validation') {
        return (
          <div className="wizard-summary-grid">
            <div className="wizard-summary-item"><span>Client Name</span><strong>{project.client_name || '—'}</strong></div>
            <div className="wizard-summary-item"><span>Location</span><strong>{project.location || '—'}</strong></div>
            <div className="wizard-summary-item"><span>Contact Person</span><strong>{project.client_email || project.client_phone || '—'}</strong></div>
            <div className="wizard-summary-item"><span>Project Type</span><strong>{project.project_type || '—'}</strong></div>
            <div className="wizard-summary-item"><span>Priority Level</span><strong>{project.priority || '—'}</strong></div>
            <div className="wizard-summary-item"><span>Expected Delivery Date</span><strong>{project.expected_delivery_date ? formatDateTime(project.expected_delivery_date) : '—'}</strong></div>
            <div className="wizard-summary-item"><span>Inquiry Submission Date</span><strong>{formatDateTime(project.created_at)}</strong></div>
            <div className="wizard-summary-item"><span>Inquiry ID</span><strong>{project.inquiry_number || project.id}</strong></div>
          </div>
        );
      }
      if (selectedSubStep?.key === 'document_checklist') {
        return (
          <div className="form-group">
            {[
              ['technical_drawing', 'Technical Drawing'], ['boq', 'BOQ'], ['spec_sheet', 'Spec Sheet'], ['client_po', 'Client PO'], ['site_photos', 'Site Photos']
            ].map(([key, label]) => (
              <div key={key} className="form-row wizard-form-grid">
                <div className="form-group"><label>{label}</label></div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={stageInput.documents?.[key]?.status || 'missing'} onChange={(e) => setStageInput(prev => ({ ...prev, documents: { ...prev.documents, [key]: { ...prev.documents[key], status: e.target.value } } }))}>
                    <option value="received">Received</option><option value="missing">Missing</option><option value="n_a">N/A</option>
                  </select>
                </div>
                <div className="form-group"><label>Uploaded Link / File Preview</label><input value={stageInput.documents?.[key]?.link || ''} onChange={(e) => setStageInput(prev => ({ ...prev, documents: { ...prev.documents, [key]: { ...prev.documents[key], link: e.target.value } } }))} /></div>
                <div className="form-group"><label>Remarks</label><input value={stageInput.documents?.[key]?.remarks || ''} onChange={(e) => setStageInput(prev => ({ ...prev, documents: { ...prev.documents, [key]: { ...prev.documents[key], remarks: e.target.value } } }))} /></div>
              </div>
            ))}
          </div>
        );
      }
      if (selectedSubStep?.key === 'risk_flag') {
        return (
          <>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Risk Severity</label><select value={stageInput.qcRisk?.severity || 'none'} onChange={(e) => setStageInput(prev => ({ ...prev, qcRisk: { ...prev.qcRisk, severity: e.target.value } }))}><option value="none">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <div className="form-group"><label>Risk Category</label><select value={stageInput.qcRisk?.category || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcRisk: { ...prev.qcRisk, category: e.target.value } }))}><option value="">Select</option><option value="technical">Technical</option><option value="commercial">Commercial</option><option value="timeline">Timeline</option><option value="compliance">Compliance</option></select></div>
            </div>
            <div className="form-group"><label>Risk Description</label><textarea rows={3} value={stageInput.qcRisk?.description || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcRisk: { ...prev.qcRisk, description: e.target.value } }))} /></div>
            <div className="form-group"><label>Recommended Action</label><textarea rows={3} value={stageInput.qcRisk?.action || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcRisk: { ...prev.qcRisk, action: e.target.value } }))} /></div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Flag Raised By - Name</label><input value={stageInput.qcRisk?.raised_by_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcRisk: { ...prev.qcRisk, raised_by_name: e.target.value } }))} /></div>
              <div className="form-group"><label>Designation</label><input value={stageInput.qcRisk?.raised_by_designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcRisk: { ...prev.qcRisk, raised_by_designation: e.target.value } }))} /></div>
            </div>
          </>
        );
      }
      return (
        <>
          <div className="wizard-summary-grid">
            <div className="wizard-summary-item"><span>Inquiry Validation</span><strong>Reviewed</strong></div>
            <div className="wizard-summary-item"><span>Document Status</span><strong>{Object.values(stageInput.documents || {}).filter((doc) => doc.status === 'received').length} Received</strong></div>
            <div className="wizard-summary-item"><span>Risk Severity</span><strong>{stageInput.qcRisk?.severity || 'none'}</strong></div>
          </div>
          <div className="form-row wizard-form-grid">
            <div className="form-group"><label>Reviewed by</label><input value={stageInput.qcSignoff?.reviewer_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcSignoff: { ...prev.qcSignoff, reviewer_name: e.target.value } }))} /></div>
            <div className="form-group"><label>Designation</label><input value={stageInput.qcSignoff?.designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcSignoff: { ...prev.qcSignoff, designation: e.target.value } }))} /></div>
            <div className="form-group"><label>Date</label><input type="date" value={stageInput.qcSignoff?.date || ''} onChange={(e) => setStageInput(prev => ({ ...prev, qcSignoff: { ...prev.qcSignoff, date: e.target.value } }))} /></div>
          </div>
          <label className="wizard-toggle-item"><span>I confirm this inquiry has passed QC review and is ready for Technical stage</span><span className="wizard-switch"><input type="checkbox" checked={Boolean(stageInput.qcSignoff?.acknowledged)} onChange={(e) => setStageInput(prev => ({ ...prev, qcSignoff: { ...prev.qcSignoff, acknowledged: e.target.checked } }))} /><span className="wizard-switch-slider" /></span></label>
        </>
      );
    }

    if (viewedStageKey === 'technical_review') {
      if (selectedSubStep?.key === 'scope_assessment') {
        return (
            <>
            <div className="form-group"><label>Project Scope Description</label><textarea ref={scopeDescriptionRef} rows={3} className={validationErrors.technical_scope_description ? 'input-error' : ''} value={stageInput.scope?.description || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, scope: { ...prev.scope, description: e.target.value } })); clearValidationError('technical_scope_description'); }} />{validationErrors.technical_scope_description && <div className="field-error-text">{validationErrors.technical_scope_description}</div>}</div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Work Type</label><select ref={scopeWorkTypeRef} className={validationErrors.technical_scope_work_type ? 'input-error' : ''} value={stageInput.scope?.work_type || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, scope: { ...prev.scope, work_type: e.target.value } })); clearValidationError('technical_scope_work_type'); }}><option value="">Select</option><option>Supply Only</option><option>Supply & Install</option><option>Design & Build</option><option>Consultancy</option></select>{validationErrors.technical_scope_work_type && <div className="field-error-text">{validationErrors.technical_scope_work_type}</div>}</div>
              <div className="form-group"><label>Technical Complexity Rating</label><select ref={scopeComplexityRef} className={validationErrors.technical_scope_complexity ? 'input-error' : ''} value={stageInput.scope?.complexity || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, scope: { ...prev.scope, complexity: e.target.value } })); clearValidationError('technical_scope_complexity'); }}><option value="">Select</option><option>Simple</option><option>Moderate</option><option>Complex</option><option>Critical</option></select>{validationErrors.technical_scope_complexity && <div className="field-error-text">{validationErrors.technical_scope_complexity}</div>}</div>
              <div className="form-group"><label>Estimated Project Duration</label><input value={stageInput.scope?.duration || ''} onChange={(e) => setStageInput(prev => ({ ...prev, scope: { ...prev.scope, duration: e.target.value } }))} /></div>
            </div>
            <label className="wizard-toggle-item"><span>Site Visit Required</span><span className="wizard-switch"><input type="checkbox" checked={stageInput.scope?.site_visit_required === 'yes'} onChange={(e) => setStageInput(prev => ({ ...prev, scope: { ...prev.scope, site_visit_required: e.target.checked ? 'yes' : 'no' } }))} /><span className="wizard-switch-slider" /></span></label>
            <div className="form-group"><label>Special Conditions</label><textarea ref={scopeSpecialConditionsRef} rows={3} className={validationErrors.technical_risk_input ? 'input-error' : ''} value={stageInput.scope?.special_conditions || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, scope: { ...prev.scope, special_conditions: e.target.value } })); clearValidationError('technical_risk_input'); }} /></div>
          </>
        );
      }
      if (selectedSubStep?.key === 'wind_load_check') {
        return (
          <>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Project Location / Zone</label><input value={stageInput.wind?.location_zone || project.location || ''} onChange={(e) => setStageInput(prev => ({ ...prev, wind: { ...prev.wind, location_zone: e.target.value } }))} /></div>
              <div className="form-group"><label>Wind Speed (km/h)</label><input type="number" value={stageInput.wind?.wind_speed || ''} onChange={(e) => setStageInput(prev => ({ ...prev, wind: { ...prev.wind, wind_speed: e.target.value } }))} /></div>
              <div className="form-group"><label>Wind Load Standard / Code</label><select value={stageInput.wind?.code_used || ''} onChange={(e) => setStageInput(prev => ({ ...prev, wind: { ...prev.wind, code_used: e.target.value } }))}><option value="">Select</option><option>ASCE 7</option><option>BS 6399</option><option>EN 1991</option><option>Local Code</option></select></div>
            </div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Calculated Wind Pressure</label><input value={stageInput.wind?.wind_pressure || ''} onChange={(e) => setStageInput(prev => ({ ...prev, wind: { ...prev.wind, wind_pressure: e.target.value } }))} /></div>
              <div className="form-group"><label>Result Status</label><select ref={windResultStatusRef} className={validationErrors.technical_wind_result_status ? 'input-error' : ''} value={stageInput.wind?.result_status || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, wind: { ...prev.wind, result_status: e.target.value } })); clearValidationError('technical_wind_result_status'); }}><option value="">Select</option><option>Pass</option><option>Fail</option><option>Requires Review</option></select>{validationErrors.technical_wind_result_status && <div className="field-error-text">{validationErrors.technical_wind_result_status}</div>}</div>
              <div className="form-group"><label>Wind Load Calculation Document</label><input type="file" /></div>
            </div>
            <div className="form-group"><label>Remarks</label><textarea ref={windRemarksRef} rows={3} className={validationErrors.technical_risk_input ? 'input-error' : ''} value={stageInput.wind?.remarks || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, wind: { ...prev.wind, remarks: e.target.value } })); clearValidationError('technical_risk_input'); }} /></div>
          </>
        );
      }
      if (selectedSubStep?.key === 'design_proposal') {
        return (
          <>
            <label className="wizard-toggle-item"><span>New Design Required?</span><span className="wizard-switch"><input type="checkbox" checked={stageInput.design?.new_design_required === 'yes'} onChange={(e) => setStageInput(prev => ({ ...prev, design: { ...prev.design, new_design_required: e.target.checked ? 'yes' : 'no' } }))} /><span className="wizard-switch-slider" /></span></label>
            {stageInput.design?.new_design_required === 'yes' ? (
              <>
                <div className="form-group"><label>Design Title</label><input value={stageInput.design?.title || ''} onChange={(e) => setStageInput(prev => ({ ...prev, design: { ...prev.design, title: e.target.value } }))} /></div>
                <div className="form-group"><label>Design Description</label><textarea rows={3} value={stageInput.design?.description || ''} onChange={(e) => setStageInput(prev => ({ ...prev, design: { ...prev.design, description: e.target.value } }))} /></div>
                <div className="form-row wizard-form-grid">
                  <div className="form-group"><label>Design Drawings / Sketches</label><input type="file" /></div>
                  <div className="form-group"><label>Revision Number</label><input value={stageInput.design?.revision || ''} onChange={(e) => setStageInput(prev => ({ ...prev, design: { ...prev.design, revision: e.target.value } }))} /></div>
                </div>
                <div className="form-row wizard-form-grid">
                  <div className="form-group"><label>Prepared By - Name</label><input value={stageInput.design?.prepared_by_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, design: { ...prev.design, prepared_by_name: e.target.value } }))} /></div>
                  <div className="form-group"><label>Designation</label><input value={stageInput.design?.prepared_by_designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, design: { ...prev.design, prepared_by_designation: e.target.value } }))} /></div>
                </div>
              </>
            ) : <p className="form-helper-text">No new design required. Existing design is confirmed.</p>}
          </>
        );
      }
      if (selectedSubStep?.key === 'structural_calculation') {
        return (
          <>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Calculation Reference Number</label><input value={stageInput.structural?.reference_number || ''} onChange={(e) => setStageInput(prev => ({ ...prev, structural: { ...prev.structural, reference_number: e.target.value } }))} /></div>
              <div className="form-group"><label>Calculation Method</label><select value={stageInput.structural?.method || ''} onChange={(e) => setStageInput(prev => ({ ...prev, structural: { ...prev.structural, method: e.target.value } }))}><option value="">Select</option><option>Manual</option><option>Software-based</option><option>Third Party</option></select></div>
              <div className="form-group"><label>Software Used</label><input value={stageInput.structural?.software || ''} onChange={(e) => setStageInput(prev => ({ ...prev, structural: { ...prev.structural, software: e.target.value } }))} /></div>
            </div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Structural Calculation Document</label><input type="file" /></div>
              <div className="form-group"><label>Verification Status</label><select ref={structuralVerificationStatusRef} className={validationErrors.technical_structural_verification_status ? 'input-error' : ''} value={stageInput.structural?.verification_status || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, structural: { ...prev.structural, verification_status: e.target.value } })); clearValidationError('technical_structural_verification_status'); }}><option value="">Select</option><option>Pending</option><option>Verified</option><option>Rejected</option></select>{validationErrors.technical_structural_verification_status && <div className="field-error-text">{validationErrors.technical_structural_verification_status}</div>}</div>
            </div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Verified By - Name</label><input value={stageInput.structural?.verified_by_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, structural: { ...prev.structural, verified_by_name: e.target.value } }))} /></div>
              <div className="form-group"><label>Designation</label><input value={stageInput.structural?.verified_by_designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, structural: { ...prev.structural, verified_by_designation: e.target.value } }))} /></div>
              <div className="form-group"><label>Company</label><input value={stageInput.structural?.verified_by_company || ''} onChange={(e) => setStageInput(prev => ({ ...prev, structural: { ...prev.structural, verified_by_company: e.target.value } }))} /></div>
            </div>
          </>
        );
      }
      if (selectedSubStep?.key === 'technical_submittal') {
        return (
          <>
            <div className="form-group"><label>Submittal Package Title</label><input value={stageInput.submittal?.title || ''} onChange={(e) => setStageInput(prev => ({ ...prev, submittal: { ...prev.submittal, title: e.target.value } }))} /></div>
            <div className="form-group"><label>Included Documents</label><ul><li>Wind Load Calculation</li><li>{stageInput.design?.new_design_required === 'yes' ? 'Design Drawings / Sketches' : 'Design Confirmation Note'}</li><li>Structural Calculation</li></ul></div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Submitted by - Full Name</label><input value={stageInput.submittal?.submitted_by_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, submittal: { ...prev.submittal, submitted_by_name: e.target.value } }))} /></div>
              <div className="form-group"><label>Designation</label><select value={stageInput.submittal?.submitted_by_designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, submittal: { ...prev.submittal, submitted_by_designation: e.target.value } }))}><option value="">Select</option><option>Junior Engineer</option><option>Senior Engineer</option><option>Lead Engineer</option><option>Technical Manager</option></select></div>
              <div className="form-group"><label>Submission Date</label><input type="date" value={stageInput.submittal?.date || ''} onChange={(e) => setStageInput(prev => ({ ...prev, submittal: { ...prev.submittal, date: e.target.value } }))} /></div>
            </div>
            <div className="form-group"><label>Submittal Remarks</label><textarea ref={technicalFeedbackRef} rows={3} className={validationErrors.technical_feedback ? 'input-error' : ''} value={stageInput.submittal?.remarks || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, submittal: { ...prev.submittal, remarks: e.target.value } })); clearValidationError('technical_feedback'); }} />{validationErrors.technical_feedback && <div className="field-error-text">{validationErrors.technical_feedback}</div>}</div>
            <div className="form-group"><label>Additional Supporting Documents</label><input type="file" /></div>
          </>
        );
      }
      return (
          <>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Authorized by - Full Name</label><input ref={technicalSignoffAuthorizedNameRef} className={validationErrors.technical_signoff_authorized_name ? 'input-error' : ''} value={stageInput.technicalSignoff?.authorized_name || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, technicalSignoff: { ...prev.technicalSignoff, authorized_name: e.target.value } })); clearValidationError('technical_signoff_authorized_name'); }} />{validationErrors.technical_signoff_authorized_name && <div className="field-error-text">{validationErrors.technical_signoff_authorized_name}</div>}</div>
              <div className="form-group"><label>Designation</label><select ref={technicalSignoffDesignationRef} className={validationErrors.technical_signoff_designation ? 'input-error' : ''} value={stageInput.technicalSignoff?.designation || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, technicalSignoff: { ...prev.technicalSignoff, designation: e.target.value } })); clearValidationError('technical_signoff_designation'); }}><option value="">Select</option><option>Senior Engineer</option><option>Technical Manager</option><option>Director of Engineering</option></select>{validationErrors.technical_signoff_designation && <div className="field-error-text">{validationErrors.technical_signoff_designation}</div>}</div>
              <div className="form-group"><label>Department</label><input ref={technicalSignoffDepartmentRef} className={validationErrors.technical_signoff_department ? 'input-error' : ''} value={stageInput.technicalSignoff?.department || ''} onChange={(e) => { setStageInput(prev => ({ ...prev, technicalSignoff: { ...prev.technicalSignoff, department: e.target.value } })); clearValidationError('technical_signoff_department'); }} />{validationErrors.technical_signoff_department && <div className="field-error-text">{validationErrors.technical_signoff_department}</div>}</div>
            </div>
          <div className="form-group"><label>Date</label><input type="date" value={stageInput.technicalSignoff?.date || ''} onChange={(e) => setStageInput(prev => ({ ...prev, technicalSignoff: { ...prev.technicalSignoff, date: e.target.value } }))} /></div>
          <div ref={technicalSignoffAcknowledgedRef} tabIndex={-1} className={validationErrors.technical_signoff_acknowledged ? 'field-error-group' : ''}>
            <label className="wizard-toggle-item"><span>I confirm all technical documents are verified and accurate</span><span className="wizard-switch"><input type="checkbox" checked={Boolean(stageInput.technicalSignoff?.acknowledged)} onChange={(e) => { setStageInput(prev => ({ ...prev, technicalSignoff: { ...prev.technicalSignoff, acknowledged: e.target.checked } })); clearValidationError('technical_signoff_acknowledged'); }} /><span className="wizard-switch-slider" /></span></label>
            {validationErrors.technical_signoff_acknowledged && <div className="field-error-text">{validationErrors.technical_signoff_acknowledged}</div>}
          </div>
        </>
      );
    }

    if (viewedStageKey === 'estimation') {
      if (selectedSubStep?.key === 'cost_breakdown') {
        return (
          <div className="form-group">
            {(stageInput.costRows || []).map((row, idx) => (
              <div key={idx} className="form-row wizard-form-grid">
                <div className="form-group"><input placeholder="Line item description" value={row.description} onChange={(e) => setStageInput(prev => ({ ...prev, costRows: prev.costRows.map((r, i) => i === idx ? { ...r, description: e.target.value } : r) }))} /></div>
                <div className="form-group"><select value={row.category} onChange={(e) => setStageInput(prev => ({ ...prev, costRows: prev.costRows.map((r, i) => i === idx ? { ...r, category: e.target.value } : r) }))}><option value="material">Material</option><option value="labor">Labor</option><option value="overhead">Overhead</option><option value="subcontract">Subcontract</option><option value="contingency">Contingency</option></select></div>
                <div className="form-group"><input type="number" value={row.quantity} onChange={(e) => setStageInput(prev => ({ ...prev, costRows: prev.costRows.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r) }))} placeholder="Qty" /></div>
                <div className="form-group"><select value={row.unit} onChange={(e) => setStageInput(prev => ({ ...prev, costRows: prev.costRows.map((r, i) => i === idx ? { ...r, unit: e.target.value } : r) }))}><option>m²</option><option>m</option><option>pcs</option><option>lot</option><option>hr</option></select></div>
                <div className="form-group"><input type="number" value={row.unit_cost} onChange={(e) => setStageInput(prev => ({ ...prev, costRows: prev.costRows.map((r, i) => i === idx ? { ...r, unit_cost: e.target.value } : r) }))} placeholder="Unit cost" /></div>
                <div className="form-group"><input readOnly value={(() => {
                  const qty = Number(row.quantity);
                  const unitCost = Number(row.unit_cost);
                  const total = Number.isFinite(qty) && Number.isFinite(unitCost) ? qty * unitCost : 0;
                  return total.toFixed(2);
                })()} /></div>
              </div>
            ))}
            <div className="form-actions"><button type="button" className="btn-secondary" onClick={() => setStageInput(prev => ({ ...prev, costRows: [...prev.costRows, { description: '', category: 'material', quantity: '', unit: 'm²', unit_cost: '' }] }))}>Add Row</button><button type="button" className="btn-secondary" onClick={() => setStageInput(prev => ({ ...prev, costRows: prev.costRows.length > 1 ? prev.costRows.slice(0, -1) : prev.costRows }))}>Remove Row</button></div>
            <p className="form-helper-text">Grand Total: {getEstimationTotalCost().toFixed(2)}</p>
          </div>
        );
      }
      if (selectedSubStep?.key === 'margin_pricing') {
        return (
          <>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Total Cost</label><input readOnly value={getEstimationTotalCost().toFixed(2)} /></div>
              <div className="form-group"><label>Profit Margin %</label><input type="range" min="0" max="100" value={stageInput.margin?.profit_margin || 0} onChange={(e) => setStageInput(prev => ({ ...prev, margin: { ...prev.margin, profit_margin: e.target.value } }))} /><input type="number" value={stageInput.margin?.profit_margin || ''} onChange={(e) => setStageInput(prev => ({ ...prev, margin: { ...prev.margin, profit_margin: e.target.value } }))} /></div>
              <div className="form-group"><label>Discount %</label><input type="number" value={stageInput.margin?.discount || ''} onChange={(e) => setStageInput(prev => ({ ...prev, margin: { ...prev.margin, discount: e.target.value } }))} /></div>
            </div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Final Selling Price</label><input readOnly value={getFinalSellingPrice().toFixed(2)} /></div>
              <div className="form-group"><label>Currency</label><select value={stageInput.margin?.currency || 'SAR'} onChange={(e) => setStageInput(prev => ({ ...prev, margin: { ...prev.margin, currency: e.target.value } }))}><option>SAR</option><option>USD</option><option>EUR</option><option>AED</option></select></div>
              <div className="form-group"><label>Price Validity Date</label><input type="date" value={stageInput.margin?.validity_date || ''} onChange={(e) => setStageInput(prev => ({ ...prev, margin: { ...prev.margin, validity_date: e.target.value } }))} /></div>
            </div>
            <div className="form-group"><label>Pricing Notes</label><textarea rows={3} value={stageInput.margin?.notes || ''} onChange={(e) => setStageInput(prev => ({ ...prev, margin: { ...prev.margin, notes: e.target.value } }))} /></div>
          </>
        );
      }
      if (selectedSubStep?.key === 'comparison_check') {
        const row = (stageInput.comparisonRows || [])[0] || { project_name: '', year: '', original_cost: '', remarks: '' };
        const hasReference = Number(row.original_cost) > 0;
        const variance = hasReference ? (((getEstimationTotalCost() - Number(row.original_cost)) / Number(row.original_cost)) * 100) : 0;
        const status = !hasReference
          ? 'No Reference Data'
          : variance > VARIANCE_THRESHOLD_PERCENT
            ? 'Over Budget'
            : variance < -VARIANCE_THRESHOLD_PERCENT
              ? 'Under Budget'
              : 'Within Range';
        return (
          <>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Reference Project Name</label><input value={row.project_name} onChange={(e) => setStageInput(prev => ({ ...prev, comparisonRows: [{ ...row, project_name: e.target.value }] }))} /></div>
              <div className="form-group"><label>Year</label><input value={row.year} onChange={(e) => setStageInput(prev => ({ ...prev, comparisonRows: [{ ...row, year: e.target.value }] }))} /></div>
              <div className="form-group"><label>Original Cost</label><input type="number" value={row.original_cost} onChange={(e) => setStageInput(prev => ({ ...prev, comparisonRows: [{ ...row, original_cost: e.target.value }] }))} /></div>
            </div>
            <div className="form-row wizard-form-grid">
              <div className="form-group"><label>Variance %</label><input readOnly value={`${variance.toFixed(2)}%`} /></div>
              <div className="form-group"><label>Status</label><input readOnly value={status} /></div>
              <div className="form-group"><button type="button" className="btn-secondary" onClick={() => setStageInput(prev => ({ ...prev, comparisonRows: [...(prev.comparisonRows || []), { project_name: '', year: '', original_cost: '', remarks: '' }] }))}>Add Comparison Row</button></div>
            </div>
            <div className="form-group"><label>Remarks</label><textarea rows={3} value={row.remarks} onChange={(e) => setStageInput(prev => ({ ...prev, comparisonRows: [{ ...row, remarks: e.target.value }] }))} /></div>
          </>
        );
      }
      if (selectedSubStep?.key === 'vendor_quotations') {
        return (
          <div className="form-group">
            {(stageInput.vendorRows || []).map((row, idx) => (
              <div key={idx} className="form-row wizard-form-grid">
                <div className="form-group"><input placeholder="Vendor name" value={row.vendor_name} onChange={(e) => setStageInput(prev => ({ ...prev, vendorRows: prev.vendorRows.map((r, i) => i === idx ? { ...r, vendor_name: e.target.value } : r) }))} /></div>
                <div className="form-group"><input placeholder="Quotation reference number" value={row.reference} onChange={(e) => setStageInput(prev => ({ ...prev, vendorRows: prev.vendorRows.map((r, i) => i === idx ? { ...r, reference: e.target.value } : r) }))} /></div>
                <div className="form-group"><input type="number" placeholder="Quoted amount" value={row.amount} onChange={(e) => setStageInput(prev => ({ ...prev, vendorRows: prev.vendorRows.map((r, i) => i === idx ? { ...r, amount: e.target.value } : r) }))} /></div>
                <div className="form-group"><input type="date" value={row.validity_date} onChange={(e) => setStageInput(prev => ({ ...prev, vendorRows: prev.vendorRows.map((r, i) => i === idx ? { ...r, validity_date: e.target.value } : r) }))} /></div>
                <div className="form-group"><input type="file" /></div>
                <label className="wizard-toggle-item"><span>Selected Vendor</span><span className="wizard-switch"><input type="checkbox" checked={Boolean(row.selected)} onChange={(e) => setStageInput(prev => ({ ...prev, vendorRows: prev.vendorRows.map((r, i) => i === idx ? { ...r, selected: e.target.checked } : r) }))} /><span className="wizard-switch-slider" /></span></label>
                <div className="form-group"><input placeholder="Remarks" value={row.remarks || ''} onChange={(e) => setStageInput(prev => ({ ...prev, vendorRows: prev.vendorRows.map((r, i) => i === idx ? { ...r, remarks: e.target.value } : r) }))} /></div>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => setStageInput(prev => ({ ...prev, vendorRows: [...prev.vendorRows, { vendor_name: '', reference: '', amount: '', validity_date: '', upload: '', selected: false, remarks: '' }] }))}>Add Vendor Row</button>
          </div>
        );
      }
      return (
        <>
          <div className="form-row wizard-form-grid">
            <div className="form-group"><label>Estimated by - Full Name</label><input value={stageInput.estimationSignoff?.estimated_by_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, estimationSignoff: { ...prev.estimationSignoff, estimated_by_name: e.target.value } }))} /></div>
            <div className="form-group"><label>Designation</label><select value={stageInput.estimationSignoff?.designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, estimationSignoff: { ...prev.estimationSignoff, designation: e.target.value } }))}><option value="">Select</option><option>Junior Estimator</option><option>Senior Estimator</option><option>Chief Estimator</option><option>Estimation Manager</option></select></div>
            <div className="form-group"><label>Department</label><input value={stageInput.estimationSignoff?.department || ''} onChange={(e) => setStageInput(prev => ({ ...prev, estimationSignoff: { ...prev.estimationSignoff, department: e.target.value } }))} /></div>
          </div>
          <div className="form-row wizard-form-grid">
            <div className="form-group"><label>Date</label><input type="date" value={stageInput.estimationSignoff?.date || ''} onChange={(e) => setStageInput(prev => ({ ...prev, estimationSignoff: { ...prev.estimationSignoff, date: e.target.value } }))} /></div>
            <div className="form-group"><label>Final Estimated Value</label><input readOnly value={getFinalSellingPrice().toFixed(2)} /></div>
          </div>
          <label className="wizard-toggle-item"><span>I confirm this estimation is accurate and ready for CEO Approval</span><span className="wizard-switch"><input type="checkbox" checked={Boolean(stageInput.estimationSignoff?.acknowledged)} onChange={(e) => setStageInput(prev => ({ ...prev, estimationSignoff: { ...prev.estimationSignoff, acknowledged: e.target.checked } }))} /><span className="wizard-switch-slider" /></span></label>
        </>
      );
    }

    if (selectedSubStep?.key === 'summary_review') {
      return (
        <div className="wizard-summary-grid">
          <div className="wizard-summary-item"><span>QC Stage</span><strong>{stageInput.qcRisk?.severity || '—'}</strong></div>
          <div className="wizard-summary-item"><span>Technical Stage</span><strong>{stageInput.scope?.complexity || '—'}</strong></div>
          <div className="wizard-summary-item"><span>Estimation Stage</span><strong>{quotation?.final_price || getFinalSellingPrice() || '—'}</strong></div>
          <div className="wizard-summary-item"><span>Overall Turnaround</span><strong>{formatDuration(project?.created_at, overallTurnaroundEnd)}</strong></div>
        </div>
      );
    }
    if (selectedSubStep?.key === 'commercial_terms') {
      return (
        <>
          <div className="form-row wizard-form-grid">
            <div className="form-group"><label>Payment Terms</label><select value={stageInput.commercialTerms?.payment_terms || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, payment_terms: e.target.value } }))}><option value="">Select</option><option>Advance</option><option>30 Days</option><option>60 Days</option><option>Milestone-based</option></select></div>
            <div className="form-group"><label>Payment Percentage Breakdown</label><input value={stageInput.commercialTerms?.milestone_breakdown || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, milestone_breakdown: e.target.value } }))} /></div>
            <div className="form-group"><label>Delivery Timeline (weeks)</label><input type="number" value={stageInput.commercialTerms?.delivery_timeline_weeks || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, delivery_timeline_weeks: e.target.value } }))} /></div>
          </div>
          <div className="form-row wizard-form-grid">
            <div className="form-group"><label>Warranty Terms</label><select value={stageInput.commercialTerms?.warranty_terms || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, warranty_terms: e.target.value } }))}><option value="">Select</option><option>No Warranty</option><option>1 Year</option><option>2 Years</option><option>5 Years</option><option>Custom</option></select></div>
            <div className="form-group"><label>Contract Type</label><select value={stageInput.commercialTerms?.contract_type || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, contract_type: e.target.value } }))}><option value="">Select</option><option>Lump Sum</option><option>Unit Rate</option><option>Cost Plus</option><option>Framework</option></select></div>
            <div className="form-group"><label>Client PO Reference</label><input value={stageInput.commercialTerms?.client_po_reference || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, client_po_reference: e.target.value } }))} /></div>
          </div>
          <div className="form-group"><label>Special Commercial Conditions</label><textarea rows={3} value={stageInput.commercialTerms?.special_conditions || ''} onChange={(e) => setStageInput(prev => ({ ...prev, commercialTerms: { ...prev.commercialTerms, special_conditions: e.target.value } }))} /></div>
        </>
      );
    }
    if (selectedSubStep?.key === 'risk_assessment') {
      return (
        <>
          <div className="form-group"><label>Mitigation Strategy per Risk</label><textarea rows={3} value={stageInput.ceoRisk?.mitigation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoRisk: { ...prev.ceoRisk, mitigation: e.target.value } }))} /></div>
          <div className="form-row wizard-form-grid">
            <div className="form-group"><label>CEO Risk Tolerance</label><select value={stageInput.ceoRisk?.tolerance || 'mitigate'} onChange={(e) => setStageInput(prev => ({ ...prev, ceoRisk: { ...prev.ceoRisk, tolerance: e.target.value } }))}><option>Accept</option><option>Mitigate</option><option>Escalate</option></select></div>
            <div className="form-group"><label>Overall Risk Rating</label><select value={stageInput.ceoRisk?.overall_rating || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoRisk: { ...prev.ceoRisk, overall_rating: e.target.value } }))}><option value="">Select</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
          </div>
          <div className="form-group"><label>Additional CEO Remarks</label><textarea rows={3} value={stageInput.ceoRisk?.remarks || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoRisk: { ...prev.ceoRisk, remarks: e.target.value } }))} /></div>
        </>
      );
    }
    if (selectedSubStep?.key === 'decision') {
      return (
        <>
          <div className="form-group">
            <label>Decision</label>
            <div className="decision-buttons">
              <button type="button" className={`btn-decision ${stageInput.ceoDecision?.decision === 'approve' ? 'active approve' : ''}`} onClick={() => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, decision: 'approve' } }))}>Approve</button>
              <button type="button" className={`btn-decision ${stageInput.ceoDecision?.decision === 'request_revision' ? 'active' : ''}`} onClick={() => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, decision: 'request_revision' } }))}>Request Revision</button>
              <button type="button" className={`btn-decision ${stageInput.ceoDecision?.decision === 'reject' ? 'active reject' : ''}`} onClick={() => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, decision: 'reject' } }))}>Reject</button>
            </div>
          </div>
          {stageInput.ceoDecision?.decision === 'request_revision' && (
            <>
              <div className="form-row wizard-form-grid">
                <div className="form-group"><label>Revision Required From</label><select value={stageInput.ceoDecision?.revision_required_from || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, revision_required_from: e.target.value } }))}><option value="">Select</option><option>Sales</option><option>QC</option><option>Technical</option><option>Estimation</option></select></div>
                <div className="form-group"><label>Return Deadline</label><input type="date" value={stageInput.ceoDecision?.return_deadline || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, return_deadline: e.target.value } }))} /></div>
              </div>
              <div className="form-group"><label>Revision Instructions</label><textarea rows={3} value={stageInput.ceoDecision?.revision_instructions || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, revision_instructions: e.target.value } }))} /></div>
            </>
          )}
          {stageInput.ceoDecision?.decision === 'reject' && (
            <>
              <div className="form-group"><label>Rejection Reason</label><select value={stageInput.ceoDecision?.rejection_reason || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, rejection_reason: e.target.value } }))}><option value="">Select</option><option>Budget Exceeded</option><option>Scope Unclear</option><option>Risk Too High</option><option>Client Issue</option><option>Other</option></select></div>
              <div className="form-group"><label>Rejection Remarks</label><textarea rows={3} value={stageInput.ceoDecision?.rejection_remarks || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, rejection_remarks: e.target.value } }))} /></div>
            </>
          )}
          <div className="form-group"><label>Mandatory Remarks</label><textarea rows={3} value={stageInput.ceoDecision?.mandatory_remarks || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoDecision: { ...prev.ceoDecision, mandatory_remarks: e.target.value } }))} /></div>
        </>
      );
    }
    return (
      <>
        <div className="form-row wizard-form-grid">
          <div className="form-group"><label>Approved by - Full Name</label><input value={stageInput.ceoSignoff?.approved_by_name || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoSignoff: { ...prev.ceoSignoff, approved_by_name: e.target.value } }))} /></div>
          <div className="form-group"><label>Designation</label><select value={stageInput.ceoSignoff?.designation || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoSignoff: { ...prev.ceoSignoff, designation: e.target.value } }))}><option value="">Select</option><option>CEO</option><option>Managing Director</option><option>General Manager</option><option>COO</option></select></div>
          <div className="form-group"><label>Date</label><input type="date" value={stageInput.ceoSignoff?.date || ''} onChange={(e) => setStageInput(prev => ({ ...prev, ceoSignoff: { ...prev.ceoSignoff, date: e.target.value } }))} /></div>
        </div>
        <div className="form-group"><label>Digital Signature Upload</label><input type="file" /></div>
        <label className="wizard-toggle-item"><span>I confirm this inquiry has been reviewed and my decision is final</span><span className="wizard-switch"><input type="checkbox" checked={Boolean(stageInput.ceoSignoff?.acknowledged)} onChange={(e) => setStageInput(prev => ({ ...prev, ceoSignoff: { ...prev.ceoSignoff, acknowledged: e.target.checked } }))} /><span className="wizard-switch-slider" /></span></label>
      </>
    );
  };

  if (loading) return <div className="loading-spinner">Loading project...</div>;
  if (error && !project) return <div className="error-message">{error}</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="project-details">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn-secondary">← Back</button>
        <h1>{project.inquiry_number || project.id}</h1>
        <span className={`status-badge status-${project.status}`}>{project.status?.replace('_', ' ')}</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="workflow-wizard-shell">
        <div className="wizard-top-nav">
          <GutmannLogo />
          <div className="wizard-main-stepper" role="navigation" aria-label="Workflow stages">
            {allowedTopNavStages.map((stage, index) => {
              const stageState = getTopNavStageState(stage, index);
              const mainStepMarker = stageState === 'completed' ? COMPLETED_CHECKMARK : index + 1;
              const mainStepMarkerLabel = stageState === 'completed' ? `${stage.label} completed` : `${stage.label}, step ${index + 1}`;
              const stageHint = stageState === 'completed' ? 'Completed' : stageState === 'active' ? 'In Progress' : 'Pending';
              return (
                <button
                    type="button"
                    key={stage.key}
                    className={`wizard-main-step ${stageState}${showActiveStageWizard && stage.key === viewedStageKey ? ' selected' : ''}`}
                    onClick={handleCurrentStageSelect}
                    disabled={stage.key !== project?.status}
                    aria-current={stage.key === project?.status ? 'step' : undefined}
                  title={stage.key !== project?.status ? 'Cannot navigate from here. Use Previous Stages below for read-only history.' : undefined}
                >
                  <div className="wizard-main-step-header">
                    <span className="wizard-main-step-count" aria-label={mainStepMarkerLabel}>
                      {mainStepMarker}
                    </span>
                    <span className="wizard-main-step-title">{stage.label}</span>
                  </div>
                  <div className="wizard-main-step-subtext">{stageHint}</div>
                </button>
              );
            })}
          </div>
          <button type="button" className="btn-secondary wizard-save-close" onClick={() => navigate('/dashboard')}>
            Save &amp; Close
          </button>
        </div>

        <div className="wizard-content-layout">
          {showActiveStageWizard && (
            <aside className="wizard-substep-panel" role="navigation" aria-label="Sub-steps">
              <div className="wizard-sidebar-brand">
                <GutmannLogo compact />
              </div>
              <h3>{stageNumber}. {viewedStage?.label || 'Stage'} Review</h3>
              <div className="wizard-substep-list">
                {viewedSubSteps.map((subStep, index) => {
                  const subState = getSubStepState(viewedStageState, index, selectedSubStepIndex);
                  const subStepMarker = subState === 'completed' ? COMPLETED_CHECKMARK : index + 1;
                  const subStepMarkerLabel = subState === 'completed'
                    ? `${subStep.title} completed`
                    : `${subStep.title}, sub-step ${index + 1}`;
                  return (
                    <button
                      key={subStep.key}
                      type="button"
                      className={`wizard-substep-item ${subState}`}
                      onClick={() => handleSubStepSelect(index)}
                      disabled={viewedStageState === 'pending'}
                    >
                      <span className="wizard-substep-marker" aria-label={subStepMarkerLabel}>
                        {subStepMarker}
                      </span>
                      <span className="wizard-substep-copy">
                        <strong>{subStep.title}</strong>
                        <small>{subStep.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          <section className="wizard-main-panel">
            <div className="wizard-main-panel-header">
              <div>
                {showActiveStageWizard ? (
                  <>
                    <h2>{stageNumber}.{selectedSubStepIndex + 1} {selectedSubStep?.title || 'Stage Overview'}</h2>
                    <p>{selectedSubStep?.description || 'Review and configure this workflow stage.'}</p>
                  </>
                ) : (
                  <>
                    <h2>{project.status?.replace(/_/g, ' ') || 'Project Status'}</h2>
                    <p>This inquiry is not currently actionable for your role. You can view status and timeline details below.</p>
                  </>
                )}
              </div>
            </div>

            <div className="wizard-panel-card">
              {shouldShowStageForm ? (
                isCustomStage ? (
                  <>
                    {Object.keys(validationErrors).length > 0 && (
                      <div className="error-message" role="alert">
                        {validationErrors._summary || 'Please fix the highlighted fields before continuing.'}
                      </div>
                    )}
                    {renderCustomStageContent()}
                  </>
                ) : (
                <>
                  <h3>Workflow Progress &amp; Department Checklists</h3>
                  {Object.keys(validationErrors).length > 0 && (
                    <div className="error-message" role="alert">
                      Please fix the highlighted fields before continuing.
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="project-checklist-group">Department Checklist Cards *</label>
                    <div id="project-checklist-group" className="department-checklist-grid">
                      {DEPARTMENT_CHECKLIST_CARDS.map((department) => {
                        const requirements = BACKEND_STAGE_REQUIREMENTS[department.key];
                        if (!requirements) return null;
                        const isCurrentDepartment = department.key === project?.status;
                        const cardClass = isCurrentDepartment ? ' active' : '';
                        const completedCount = requirements.checklist.reduce((count, item) => (
                          count + (getChecklistState(department.key, item.key) ? 1 : 0)
                        ), 0);
                        const isDepartmentComplete = requirements.checklist.length > 0
                          && completedCount === requirements.checklist.length;
                        let departmentStatusLabel = 'Pending';
                        if (isCurrentDepartment) departmentStatusLabel = 'Current Stage';
                        else if (isDepartmentComplete) departmentStatusLabel = 'Completed';
                        return (
                          <section
                            key={department.key}
                            ref={isCurrentDepartment ? checklistRef : undefined}
                            tabIndex={isCurrentDepartment ? -1 : undefined}
                            className={`department-checklist-card${cardClass}${validationErrors.checklist && isCurrentDepartment ? ' field-error-group' : ''}`}
                          >
                            <header>
                              <h4>{department.title}</h4>
                              <span>{departmentStatusLabel}</span>
                            </header>
                            <div className="wizard-toggle-list">
                              {requirements.checklist.map((item) => {
                                const isChecked = getChecklistState(department.key, item.key);
                                return (
                                  <label key={item.key} className="wizard-toggle-item">
                                    <span>
                                      {item.label}
                                      <small className="wizard-toggle-status-text">{isChecked ? 'Completed' : 'Pending'}</small>
                                    </span>
                                    <span className="wizard-switch">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={!isCurrentDepartment}
                                        onChange={(e) => {
                                          if (!isCurrentDepartment) return;
                                          setStageInput(prev => ({
                                            ...prev,
                                            checklist: { ...prev.checklist, [item.key]: e.target.checked }
                                          }));
                                          clearValidationError('checklist');
                                        }}
                                      />
                                      <span className="wizard-switch-slider" />
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                    {validationErrors.checklist && <div className="field-error-text">{validationErrors.checklist}</div>}
                  </div>

                  {stageRequirements.requirePricing && (
                    <div className="form-row wizard-form-grid">
                      <div className="form-group">
                        <label>Estimated Cost *</label>
                        <input
                          ref={estimatedCostRef}
                          type="number"
                          min="0"
                          step="0.01"
                          className={validationErrors.estimated_cost ? 'input-error' : ''}
                          value={stageInput.estimated_cost}
                          onChange={(e) => {
                            setStageInput(prev => ({ ...prev, estimated_cost: e.target.value }));
                            clearValidationError('estimated_cost');
                          }}
                          placeholder="Enter estimated cost"
                        />
                        {validationErrors.estimated_cost && <div className="field-error-text">{validationErrors.estimated_cost}</div>}
                      </div>
                      <div className="form-group">
                        <label>Final Price *</label>
                        <input
                          ref={finalPriceRef}
                          type="number"
                          min="0"
                          step="0.01"
                          className={validationErrors.final_price ? 'input-error' : ''}
                          value={stageInput.final_price}
                          onChange={(e) => {
                            setStageInput(prev => ({ ...prev, final_price: e.target.value }));
                            clearValidationError('final_price');
                          }}
                          placeholder="Enter final price"
                        />
                        {validationErrors.final_price && <div className="field-error-text">{validationErrors.final_price}</div>}
                      </div>
                    </div>
                  )}

                  {stageRequirements.requireClientResponse && (
                    <div className="form-group">
                      <label>Client Response *</label>
                      <select
                        ref={clientResponseRef}
                        className={validationErrors.client_response ? 'input-error' : ''}
                        value={stageInput.client_response}
                        onChange={(e) => {
                          setStageInput(prev => ({ ...prev, client_response: e.target.value }));
                          clearValidationError('client_response');
                        }}
                      >
                        <option value="">Select response</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="conditional_approval">Conditional approval</option>
                      </select>
                      {validationErrors.client_response && <div className="field-error-text">{validationErrors.client_response}</div>}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Feedback / Comments *</label>
                    <textarea
                      ref={feedbackRef}
                      rows={3}
                      className={validationErrors.feedback ? 'input-error' : ''}
                      value={stageInput.feedback}
                      onChange={(e) => {
                        setStageInput(prev => ({ ...prev, feedback: e.target.value }));
                        clearValidationError('feedback');
                      }}
                      placeholder="Mandatory comments for this stage"
                    />
                    {validationErrors.feedback && <div className="field-error-text">{validationErrors.feedback}</div>}
                  </div>
                </>
                )
              ) : (
                <div className="wizard-stage-summary">
                  <div className="wizard-summary-grid">
                    <div className="wizard-summary-item">
                      <span>Client</span>
                      <strong>{project.client_name}</strong>
                    </div>
                    <div className="wizard-summary-item">
                      <span>Location</span>
                      <strong>{project.location || '—'}</strong>
                    </div>
                    <div className="wizard-summary-item">
                      <span>Created</span>
                      <strong>{formatDateTime(project.created_at)}</strong>
                    </div>
                    <div className="wizard-summary-item">
                      <span>Overall Turnaround</span>
                      <strong>{formatDuration(project?.created_at, overallTurnaroundEnd)}</strong>
                    </div>
                  </div>
                  {quotation && (
                    <div className="wizard-summary-grid secondary">
                      <div className="wizard-summary-item">
                        <span>Estimated Cost</span>
                        <strong>${quotation.estimated_cost?.toLocaleString() || 0}</strong>
                      </div>
                      <div className="wizard-summary-item">
                        <span>Final Price</span>
                        <strong>${quotation.final_price?.toLocaleString() || 0}</strong>
                      </div>
                      <div className="wizard-summary-item">
                        <span>Quotation Status</span>
                        <strong>{quotation.status || '—'}</strong>
                      </div>
                    </div>
                  )}
                  <div className="wizard-stage-metrics">
                    <h4>Stage Timeline</h4>
                    {(() => {
                      const record = stageRecords[viewedStageKey];
                      const slaClass = getSlaClass(viewedStageKey, record?.started_at, record?.completed_at);
                      return (
                        <div className="wizard-meta">
                          <span>Start: {formatDateTime(record?.started_at)}</span>
                          <span>End: {formatDateTime(record?.completed_at)}</span>
                          <span>Duration: {formatDuration(record?.started_at, record?.completed_at)}</span>
                          <span className={`sla-pill ${slaClass}`}>
                            {slaClass === 'on-time' ? 'On-time' : slaClass === 'near-deadline' ? 'Near deadline' : 'Overdue'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {showActiveStageWizard && (
              <div className="wizard-substep-nav">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleSubStepSelect(selectedSubStepIndex - 1)}
                  disabled={viewedStageState === 'pending' || selectedSubStepIndex <= 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSubStepPrimaryAction}
                  disabled={viewedStageState === 'pending' || movingNext || (!shouldSubmitTechnicalStage && isLastViewedSubStep)}
                >
                  {shouldSubmitTechnicalStage ? (movingNext ? 'Submitting...' : 'Submit') : 'Next'}
                </button>
              </div>
            )}
          </section>
        </div>

        {previousWorkflowStages.length > 0 && (
          <section className="wizard-previous-stages" aria-label="Previous stages">
            <h3>Previous Stages</h3>
            <div className="wizard-previous-stage-list">
              {previousWorkflowStages.map((stage) => {
                const stageRecord = stageRecords[stage.key];
                const stageRank = STAGE_PROGRESS_ORDER.indexOf(stage.key);
                const isCompleted = stageRank < currentRank;
                const isExpanded = Boolean(expandedPreviousStages[stage.key]);
                return (
                  <article key={stage.key} className="wizard-previous-stage-item">
                    <button
                      type="button"
                      className="wizard-previous-stage-toggle"
                      onClick={() => setExpandedPreviousStages((prev) => ({ ...prev, [stage.key]: !prev[stage.key] }))}
                      aria-expanded={isExpanded}
                    >
                      <span className="wizard-previous-stage-heading">
                        <strong>{stage.label}</strong>
                        <small>{isCompleted ? 'Completed' : 'Recorded'}</small>
                      </span>
                      <span className="wizard-previous-stage-meta">
                        <span>Start: {formatDateTime(stageRecord?.started_at)}</span>
                        <span>End: {stageRecord?.completed_at ? formatDateTime(stageRecord.completed_at) : '—'}</span>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="wizard-previous-stage-content">
                        {renderPreviousStageDetails(stage.key)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="detail-card" style={{ marginTop: '16px' }}>
        <h3>Full Audit Timeline</h3>
        {history.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          <div className="activity-timeline">
            {history.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-head">
                  <strong>{item.action?.replace(/_/g, ' ')}</strong>
                  <span>{formatDateTime(item.created_at)}</span>
                </div>
                <div className="activity-sub">
                  {(item.actor?.name || item.actor?.email || 'System')} {item.actor?.role ? `(${item.actor.role})` : ''}
                </div>
                {(item.details?.feedback || item.details?.notes || item.details?.reason || item.details?.message) && (
                  <div className="activity-note">
                    {item.details.feedback || item.details.notes || item.details.reason || item.details.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(user?.role === 'salesperson' && project.status === 'received') && (
        <div className="sticky-action-bar">
          <button onClick={handleSendToQC} className="btn-primary" disabled={sendingToQC}>
            {sendingToQC ? 'Sending...' : 'Send to QC'}
          </button>
        </div>
      )}

      {(user?.role === 'qc' && project.status === 'qc_review') && (
        <div className="sticky-action-bar">
          <button onClick={() => setShowQCReviewForm(true)} className="btn-primary">Review / Approve</button>
        </div>
      )}

      {canActOnStage && (
        <div className="sticky-action-bar">
          {project.status === 'ceo_approval' && user?.role === 'ceo' ? (
            <>
              <button
                onClick={() => handleActionClick('client_review', { decision: 'approved' })}
                className="btn-primary"
                disabled={movingNext}
              >
                {movingNext ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => handleActionClick('rejected', { decision: 'rejected' }, 'feedbackOnly')}
                className="btn-danger"
                disabled={movingNext}
              >
                {movingNext ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          ) : project.status === 'sales_followup' && user?.role === 'salesperson' ? (
            <>
              <button onClick={() => handleActionClick('client_review', { decision: 'send_to_client' })} className="btn-primary" disabled={movingNext}>
                {movingNext ? 'Sending...' : 'Send to Client'}
              </button>
              <button onClick={() => handleActionClick('qc_review', { decision: 'restart_qc' }, 'feedbackOnly')} className="btn-secondary" disabled={movingNext}>
                Restart QC
              </button>
              <button onClick={() => handleActionClick('technical_review', { decision: 'restart_technical' }, 'feedbackOnly')} className="btn-secondary" disabled={movingNext}>
                Restart Technical
              </button>
              <button onClick={() => handleActionClick('estimation', { decision: 'restart_estimation' }, 'feedbackOnly')} className="btn-secondary" disabled={movingNext}>
                Restart Estimation
              </button>
            </>
          ) : project.status === 'technical_review' && user?.role === 'technical' ? (
            <>
              <button onClick={() => handleActionClick('estimation')} className="btn-primary" disabled={movingNext}>
                {movingNext ? 'Moving...' : 'Next'}
              </button>
              <button onClick={() => handleActionClick('technical_revision', { decision: 'rejected' }, 'feedbackOnly')} className="btn-danger" disabled={movingNext}>
                Request Revision
              </button>
            </>
          ) : project.status === 'estimation' && user?.role === 'estimation' ? (
            <>
              <button onClick={() => handleActionClick('ceo_approval')} className="btn-primary" disabled={movingNext}>
                {movingNext ? 'Moving...' : 'Next'}
              </button>
              <button onClick={() => handleActionClick('technical_review', { decision: 'rejected' }, 'feedbackOnly')} className="btn-danger" disabled={movingNext}>
                Return to Technical
              </button>
            </>
          ) : project.status === 'client_review' && ['salesperson', 'client', 'ceo'].includes(user?.role) ? (
            <>
              <button onClick={() => handleActionClick('approved', { decision: 'approved' })} className="btn-primary" disabled={movingNext}>
                {movingNext ? 'Updating...' : 'Client Approved'}
              </button>
              <button onClick={() => handleActionClick('rejected', { decision: 'rejected' })} className="btn-danger" disabled={movingNext}>
                Client Rejected
              </button>
            </>
          ) : (
            <button onClick={() => handleActionClick(nextAction.nextStatus)} className="btn-primary" disabled={movingNext}>
              {movingNext ? 'Moving...' : 'Next'}
            </button>
          )}
        </div>
      )}

      {showQCReviewForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="qc-review-title">
          <div className="modal-content">
            <QCReviewForm
              inquiry={project}
              titleId="qc-review-title"
              onSuccess={async () => {
                setShowQCReviewForm(false);
                const updatedProject = await fetchAll();
                if (!isStatusActionableForRole(user?.role, updatedProject?.status)) {
                  navigate('/dashboard');
                }
              }}
              onCancel={() => setShowQCReviewForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;
