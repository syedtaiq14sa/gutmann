import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import QCReviewForm from '../components/Forms/QCReviewForm';

const WORKFLOW_STAGES = [
  { key: 'qc_review', label: 'QC' },
  { key: 'technical_review', label: 'Technical' },
  { key: 'estimation', label: 'Estimation' },
  { key: 'ceo_approval', label: 'CEO Approval' },
  { key: 'sales_followup', label: 'Sales Follow-up' },
  { key: 'client_review', label: 'Client Approval' },
  { key: 'supply_chain', label: 'Supply Chain' }
];

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

const getStageDraftStorageKey = (id, status) => `project-stage-draft:${id}:${status || 'unknown'}`;
const getQcModalStorageKey = (id) => `project-qc-modal-open:${id}`;
const getWizardUiStorageKey = (id) => `project-wizard-ui:${id}`;

const STAGE_REQUIREMENTS = {
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
    { key: 'general', title: 'General Settings', description: 'Configure baseline validation preferences and intake defaults.' },
    { key: 'roster', title: 'User Roster', description: 'Confirm owner, reviewers, and QC routing for this stage.' },
    { key: 'stage_form', title: 'QC Review', description: 'Review current stage details and complete required actions.' },
    { key: 'finalize', title: 'Finalize', description: 'Confirm readiness to move this stage forward.' }
  ],
  technical_review: [
    { key: 'general', title: 'General Settings', description: 'Define technical review scope and expected checks.' },
    { key: 'roster', title: 'User Roster', description: 'Assign accountable technical reviewers and escalation contacts.' },
    { key: 'stage_form', title: 'Technical Review', description: 'Complete the required checklist and stage comments.' },
    { key: 'finalize', title: 'Finalize', description: 'Validate completion before advancing the workflow.' }
  ],
  estimation: [
    { key: 'general', title: 'General Settings', description: 'Set estimation constraints and pricing assumptions.' },
    { key: 'roster', title: 'User Roster', description: 'Confirm the owners for estimation and commercial review.' },
    { key: 'stage_form', title: 'Estimation', description: 'Provide pricing, checklist updates, and review notes.' },
    { key: 'finalize', title: 'Finalize', description: 'Review values and prepare this stage for approval.' }
  ],
  ceo_approval: [
    { key: 'general', title: 'General Settings', description: 'Review governance preferences and approval expectations.' },
    { key: 'roster', title: 'User Roster', description: 'Confirm executive and stakeholder routing for decisioning.' },
    { key: 'stage_form', title: 'CEO Approval', description: 'Record decisions, checklist completion, and comments.' },
    { key: 'finalize', title: 'Finalize', description: 'Lock final review notes before proceeding.' }
  ],
  sales_followup: [
    { key: 'general', title: 'General Settings', description: 'Prepare follow-up approach and communication settings.' },
    { key: 'roster', title: 'User Roster', description: 'Assign account and follow-up responsibilities.' },
    { key: 'stage_form', title: 'Sales Follow-up', description: 'Track follow-up outcomes and mandatory notes.' },
    { key: 'finalize', title: 'Finalize', description: 'Confirm next workflow direction for client review.' }
  ],
  client_review: [
    { key: 'general', title: 'General Settings', description: 'Configure review window and expected client outcomes.' },
    { key: 'roster', title: 'User Roster', description: 'Confirm client-facing and internal approver contacts.' },
    { key: 'stage_form', title: 'Client Review', description: 'Capture client response and required commentary.' },
    { key: 'finalize', title: 'Finalize', description: 'Verify all client review data before completion.' }
  ],
  supply_chain: [
    { key: 'general', title: 'General Settings', description: 'Define implementation handoff preferences for execution.' },
    { key: 'roster', title: 'User Roster', description: 'Confirm supply chain owners and receiving teams.' },
    { key: 'stage_form', title: 'Supply Chain', description: 'Review handoff details and stage completion notes.' },
    { key: 'finalize', title: 'Finalize', description: 'Finalize integration handoff for operational delivery.' }
  ]
};

const createSubStepIndexState = () =>
  WORKFLOW_STAGES.reduce((acc, stage) => {
    acc[stage.key] = 0;
    return acc;
  }, {});

const createStageInputState = (status) => {
  const requirements = STAGE_REQUIREMENTS[status];
  if (!requirements) {
    return {
      checklist: {},
      feedback: '',
        estimated_cost: '',
        final_price: '',
        client_response: '',
        decision: ''
      };
  }
  return {
    checklist: requirements.checklist.reduce((acc, item) => {
      acc[item.key] = false;
      return acc;
    }, {}),
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
  const [selectedSubStepByStage, setSelectedSubStepByStage] = useState(createSubStepIndexState());
  const checklistRef = useRef(null);
  const estimatedCostRef = useRef(null);
  const finalPriceRef = useRef(null);
  const clientResponseRef = useRef(null);
  const feedbackRef = useRef(null);

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
    const defaults = createSubStepIndexState();
    const fallbackStage = WORKFLOW_STAGES.find(stage => stage.key === project.status)?.key || WORKFLOW_STAGES[0].key;
    try {
      const saved = localStorage.getItem(getWizardUiStorageKey(id));
      if (!saved) {
        setSelectedStageKey(fallbackStage);
        setSelectedSubStepByStage(defaults);
        return;
      }
      const parsed = JSON.parse(saved);
      const nextStage = WORKFLOW_STAGES.some(stage => stage.key === parsed?.selectedStageKey)
        ? parsed.selectedStageKey
        : fallbackStage;
      const hydratedSubSteps = { ...defaults };
      Object.keys(hydratedSubSteps).forEach((stageKey) => {
        const maxIndex = (STAGE_SUB_STEPS[stageKey]?.length || 1) - 1;
        const requested = Number(parsed?.selectedSubStepByStage?.[stageKey]);
        hydratedSubSteps[stageKey] = Number.isFinite(requested)
          ? Math.min(Math.max(requested, 0), Math.max(maxIndex, 0))
          : 0;
      });
      setSelectedStageKey(nextStage);
      setSelectedSubStepByStage(hydratedSubSteps);
    } catch (err) {
      console.warn('Failed to restore wizard UI state:', err);
      setSelectedStageKey(fallbackStage);
      setSelectedSubStepByStage(defaults);
    }
  }, [id, project?.status]);

  useEffect(() => {
    if (!id || !selectedStageKey) return;
    localStorage.setItem(getWizardUiStorageKey(id), JSON.stringify({
      selectedStageKey,
      selectedSubStepByStage
    }));
  }, [id, selectedStageKey, selectedSubStepByStage]);

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
      await fetchAll();
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
      await fetchAll();
      localStorage.removeItem(draftKey);
      setValidationErrors({});
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
      feedback: feedbackRef
    };
    const target = fieldRefs[fieldName]?.current;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') {
      target.focus();
    }
  };

  const validateStageAction = (mode = 'full') => {
    if (!stageRequirements) return true;
    const errors = {};
    const checklistValid = stageRequirements.checklist.every(item => stageInput.checklist[item.key]);
    const feedbackValid = stageInput.feedback.trim().length > 0;
    const estimatedCostNumber = Number(stageInput.estimated_cost);
    const finalPriceNumber = Number(stageInput.final_price);

    if (mode !== 'feedbackOnly' && !checklistValid) {
      errors.checklist = 'Please complete all checklist items.';
    }

    if ((stageRequirements.requireFeedback || mode === 'feedbackOnly') && !feedbackValid) {
      errors.feedback = 'This field is required.';
    }

    if (mode !== 'feedbackOnly' && stageRequirements.requirePricing) {
      if (!Number.isFinite(estimatedCostNumber) || estimatedCostNumber <= 0) {
        errors.estimated_cost = 'Enter a valid value greater than 0.';
      }
      if (!Number.isFinite(finalPriceNumber) || finalPriceNumber <= 0) {
        errors.final_price = 'Enter a valid value greater than 0.';
      }
    }

    if (mode !== 'feedbackOnly' && stageRequirements.requireClientResponse && !stageInput.client_response.trim()) {
      errors.client_response = 'This field is required.';
    }

    setValidationErrors(errors);
    const firstInvalidField = ['checklist', 'estimated_cost', 'final_price', 'client_response', 'feedback']
      .find((field) => errors[field]);
    if (firstInvalidField) {
      focusAndScrollToField(firstInvalidField);
      return false;
    }
    return true;
  };

  const handleActionClick = (nextStatus, extraPayload = {}, mode = 'full') => {
    if (!validateStageAction(mode)) return;
    moveStage(nextStatus, extraPayload);
  };

  const clearValidationError = (field) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const nextAction = getNextAction();
  const stageRequirements = STAGE_REQUIREMENTS[project?.status];
  const canActOnStage = Boolean(nextAction || (project?.status === 'ceo_approval' && user?.role === 'ceo'));

  const currentRank = STAGE_PROGRESS_ORDER.indexOf(project?.status);
  const viewedStageKey = selectedStageKey || project?.status || WORKFLOW_STAGES[0].key;
  const viewedStageRank = STAGE_PROGRESS_ORDER.indexOf(viewedStageKey);
  const viewedStageState = viewedStageRank < currentRank ? 'completed' : viewedStageRank === currentRank ? 'active' : 'pending';
  const viewedSubSteps = STAGE_SUB_STEPS[viewedStageKey] || [];
  const selectedSubStepIndex = Math.min(
    Math.max(selectedSubStepByStage[viewedStageKey] ?? 0, 0),
    Math.max(viewedSubSteps.length - 1, 0)
  );
  const selectedSubStep = viewedSubSteps[selectedSubStepIndex] || null;
  const stageNumber = Math.max(WORKFLOW_STAGES.findIndex(stage => stage.key === viewedStageKey) + 1, 1);
  const isViewingActiveWorkflowStage = viewedStageKey === project?.status;
  const quotation = project?.quotation || project?.quotations?.[0];
  const overallTurnaroundEnd = TERMINAL_STATUSES.includes(project?.status) ? project?.updated_at : null;

  const updateSubStepIndex = (stageKey, nextIndex) => {
    setSelectedSubStepByStage((prev) => {
      const maxIndex = (STAGE_SUB_STEPS[stageKey]?.length || 1) - 1;
      const clamped = Math.min(Math.max(nextIndex, 0), Math.max(maxIndex, 0));
      if (prev[stageKey] === clamped) return prev;
      return { ...prev, [stageKey]: clamped };
    });
  };

  const handleStageSelect = (stageKey) => {
    setSelectedStageKey(stageKey);
    if (typeof selectedSubStepByStage[stageKey] !== 'number') {
      updateSubStepIndex(stageKey, 0);
    }
  };

  const handleSubStepSelect = (index) => {
    if (viewedStageState === 'pending') return;
    updateSubStepIndex(viewedStageKey, index);
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
        <div className="wizard-main-stepper" role="navigation" aria-label="Workflow stages">
          {WORKFLOW_STAGES.map((stage, index) => {
            const stageRank = STAGE_PROGRESS_ORDER.indexOf(stage.key);
            const stageState = stageRank < currentRank ? 'completed' : stageRank === currentRank ? 'active' : 'pending';
            const isSelected = viewedStageKey === stage.key;
            return (
              <button
                type="button"
                key={stage.key}
                className={`wizard-main-step ${stageState} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleStageSelect(stage.key)}
              >
                <div className="wizard-main-step-header">
                  <span className="wizard-main-step-count">{stageState === 'completed' ? '✓' : index + 1}</span>
                  <span className="wizard-main-step-title">{stage.label}</span>
                </div>
                <div className="wizard-main-step-subtext">
                  {stageState === 'completed' ? 'Completed' : stageState === 'active' ? 'Current' : 'Pending'}
                </div>
                {stageState === 'active' && (
                  <div className="wizard-main-step-indicator" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
              </button>
            );
          })}
          <button
            type="button"
            className={`wizard-main-step wizard-main-step-cta ${TERMINAL_STATUSES.includes(project?.status) ? 'completed' : ''}`}
            onClick={() => handleStageSelect(WORKFLOW_STAGES[WORKFLOW_STAGES.length - 1].key)}
          >
            Complete Integration
          </button>
        </div>

        <div className="wizard-content-layout">
          <aside className="wizard-substep-panel" role="navigation" aria-label="Sub-steps">
            <h3>{stageNumber}. Configure {WORKFLOW_STAGES.find(stage => stage.key === viewedStageKey)?.label || 'Stage'}</h3>
            <div className="wizard-substep-list">
              {viewedSubSteps.map((subStep, index) => {
                const subState = viewedStageState === 'completed'
                  ? 'completed'
                  : viewedStageState === 'pending'
                    ? 'pending'
                    : index < selectedSubStepIndex
                      ? 'completed'
                      : index === selectedSubStepIndex
                        ? 'active'
                        : 'pending';
                return (
                  <button
                    key={subStep.key}
                    type="button"
                    className={`wizard-substep-item ${subState}`}
                    onClick={() => handleSubStepSelect(index)}
                    disabled={viewedStageState === 'pending'}
                  >
                    <span className="wizard-substep-marker">{subState === 'completed' ? '✓' : index + 1}</span>
                    <span className="wizard-substep-copy">
                      <strong>{subStep.title}</strong>
                      <small>{subStep.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="wizard-main-panel">
            <div className="wizard-main-panel-header">
              <div>
                <h2>{stageNumber}.{selectedSubStepIndex + 1} {selectedSubStep?.title || 'Stage Overview'}</h2>
                <p>{selectedSubStep?.description || 'Review and configure this workflow stage.'}</p>
              </div>
              <button type="button" className="btn-secondary wizard-save-close" onClick={() => navigate('/dashboard')}>
                Save Progress &amp; Close
              </button>
            </div>

            <div className="wizard-panel-card">
              {isViewingActiveWorkflowStage && selectedSubStep?.key === 'stage_form' && canActOnStage && stageRequirements ? (
                <>
                  <h3>Mandatory Checklist &amp; Feedback</h3>
                  {Object.keys(validationErrors).length > 0 && (
                    <div className="error-message" role="alert">
                      Please fix the highlighted fields before continuing.
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="project-checklist-group">Essential Checklist *</label>
                    <div
                      id="project-checklist-group"
                      ref={checklistRef}
                      tabIndex={-1}
                      className={validationErrors.checklist ? 'field-error-group wizard-toggle-list' : 'wizard-toggle-list'}
                    >
                      {stageRequirements.checklist.map((item) => (
                        <label key={item.key} className="wizard-toggle-item">
                          <span>{item.label}</span>
                          <span className="wizard-switch">
                            <input
                              type="checkbox"
                              checked={!!stageInput.checklist[item.key]}
                              onChange={(e) => {
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
                      ))}
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
                onClick={() => handleSubStepSelect(selectedSubStepIndex + 1)}
                disabled={viewedStageState === 'pending' || selectedSubStepIndex >= viewedSubSteps.length - 1}
              >
                Next
              </button>
            </div>
          </section>
        </div>
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
                await fetchAll();
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
