import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import QCReviewForm from '../components/Forms/QCReviewForm';

const WORKFLOW_STAGES = [
  { key: 'qc_review', label: 'QC' },
  { key: 'technical_review', label: 'Technical' },
  { key: 'estimation', label: 'Estimation' },
  { key: 'ceo_approval', label: 'CEO Approval' },
  { key: 'client_review', label: 'Client Approval' },
  { key: 'supply_chain', label: 'Supply Chain' }
];

const STAGE_PROGRESS_ORDER = [
  'received',
  'qc_review',
  'qc_revision',
  'technical_review',
  'technical_revision',
  'estimation',
  'ceo_approval',
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
  client_review: 120,
  supply_chain: 72
};

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
  client_review: {
    checklist: [
      { key: 'client_response_recorded', label: 'Client response recorded' }
    ],
    requireFeedback: true,
    requireClientResponse: true
  }
};

const createStageInputState = (status) => {
  const requirements = STAGE_REQUIREMENTS[status];
  if (!requirements) {
    return {
      checklist: {},
      feedback: '',
      estimated_cost: '',
      final_price: '',
      client_response: ''
    };
  }
  return {
    checklist: requirements.checklist.reduce((acc, item) => ({ ...acc, [item.key]: false }), {}),
    feedback: '',
    estimated_cost: '',
    final_price: '',
    client_response: ''
  };
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : '—');

const formatDuration = (start, end) => {
  if (!start) return '—';
  const from = new Date(start).getTime();
  const to = new Date(end || Date.now()).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return '—';
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowQCReviewForm(false);
    };
    if (showQCReviewForm) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQCReviewForm]);

  const fetchAll = async () => {
    const [projectRes, historyRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/inquiries/${id}/history`)
    ]);
    setProject(projectRes.data);
    setHistory(historyRes.data || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAll();
      } catch (_err) {
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    setStageInput(createStageInputState(project?.status));
  }, [project?.status]);

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
      client_review: { nextStatus: 'approved', roles: ['client'] },
      approved: { nextStatus: 'supply_chain', roles: ['ceo', 'salesperson', 'client'] }
    };
    const action = stageActions[project.status];
    if (!action || !action.roles.includes(user.role)) return null;
    return action;
  };

  const moveStage = async (nextStatus) => {
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
        client_response: stageInput.client_response
      });
      await fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move to next stage');
    } finally {
      setMovingNext(false);
    }
  };

  const nextAction = getNextAction();
  const stageRequirements = STAGE_REQUIREMENTS[project?.status];
  const checkedAllChecklist = !stageRequirements || stageRequirements.checklist.every(item => stageInput.checklist[item.key]);
  const hasFeedback = !stageRequirements?.requireFeedback || stageInput.feedback.trim().length > 0;
  const estimatedCost = Number(stageInput.estimated_cost);
  const finalPrice = Number(stageInput.final_price);
  const hasValidPricing = !stageRequirements?.requirePricing || (
    Number.isFinite(estimatedCost) &&
    estimatedCost > 0 &&
    Number.isFinite(finalPrice) &&
    finalPrice > 0
  );
  const hasClientResponse = !stageRequirements?.requireClientResponse || stageInput.client_response.trim().length > 0;
  const isNextReady = checkedAllChecklist && hasFeedback && hasValidPricing && hasClientResponse;

  const currentRank = STAGE_PROGRESS_ORDER.indexOf(project?.status);
  const quotation = project?.quotation || project?.quotations?.[0];
  const overallTurnaround = formatDuration(project?.created_at, ['approved', 'rejected', 'supply_chain'].includes(project?.status) ? project?.updated_at : null);

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

      <div className="detail-card workflow-wizard-card">
        <h3>Workflow Timeline</h3>
        <div className="wizard-timeline">
          {WORKFLOW_STAGES.map((stage) => {
            const stageRank = STAGE_PROGRESS_ORDER.indexOf(stage.key);
            const stageState = stageRank < currentRank ? 'completed' : stageRank === currentRank ? 'active' : 'pending';
            const record = stageRecords[stage.key];
            const slaClass = getSlaClass(stage.key, record?.started_at, record?.completed_at);
            return (
              <div key={stage.key} className={`wizard-stage ${stageState}`}>
                <div className={`wizard-dot ${slaClass}`} />
                <div className="wizard-content">
                  <div className="wizard-head">
                    <strong>{stage.label}</strong>
                    <span className={`wizard-state ${stageState}`}>{stageState}</span>
                    <span className={`sla-pill ${slaClass}`}>
                      {slaClass === 'on-time' ? 'On-time' : slaClass === 'near-deadline' ? 'Near deadline' : 'Overdue'}
                    </span>
                  </div>
                  <div className="wizard-meta">
                    <span>Start: {formatDateTime(record?.started_at)}</span>
                    <span>End: {formatDateTime(record?.completed_at)}</span>
                    <span>Duration: {formatDuration(record?.started_at, record?.completed_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <h3>Project Information</h3>
          <p><strong>Client:</strong> {project.client_name}</p>
          <p><strong>Description:</strong> {project.project_description}</p>
          <p><strong>Location:</strong> {project.location || '—'}</p>
          <p><strong>Created:</strong> {formatDateTime(project.created_at)}</p>
          <p><strong>Overall Turnaround:</strong> {overallTurnaround}</p>
        </div>

        {quotation && (
          <div className="detail-card">
            <h3>Quotation</h3>
            <p><strong>Estimated Cost:</strong> ${quotation.estimated_cost?.toLocaleString() || 0}</p>
            <p><strong>Final Price:</strong> ${quotation.final_price?.toLocaleString() || 0}</p>
            <p><strong>Status:</strong> {quotation.status || '—'}</p>
          </div>
        )}
      </div>

      {nextAction && stageRequirements && (
        <div className="detail-card" style={{ marginTop: '16px' }}>
          <h3>Mandatory Checklist & Feedback</h3>
          <div className="form-group">
            <label>Essential Checklist *</label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {stageRequirements.checklist.map((item) => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={!!stageInput.checklist[item.key]}
                    onChange={(e) => setStageInput(prev => ({
                      ...prev,
                      checklist: { ...prev.checklist, [item.key]: e.target.checked }
                    }))}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {stageRequirements.requirePricing && (
            <div className="form-row">
              <div className="form-group">
                <label>Estimated Cost *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stageInput.estimated_cost}
                  onChange={(e) => setStageInput(prev => ({ ...prev, estimated_cost: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Final Price *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stageInput.final_price}
                  onChange={(e) => setStageInput(prev => ({ ...prev, final_price: e.target.value }))}
                />
              </div>
            </div>
          )}

          {stageRequirements.requireClientResponse && (
            <div className="form-group">
              <label>Client Response *</label>
              <select
                value={stageInput.client_response}
                onChange={(e) => setStageInput(prev => ({ ...prev, client_response: e.target.value }))}
              >
                <option value="">Select response</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="conditional_approval">Conditional approval</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Feedback / Comments *</label>
            <textarea
              rows={3}
              value={stageInput.feedback}
              onChange={(e) => setStageInput(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Mandatory comments for this stage"
            />
          </div>
        </div>
      )}

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

      {nextAction && (
        <div className="sticky-action-bar">
          {project.status === 'ceo_approval' && user?.role === 'ceo' ? (
            <>
              <button onClick={() => moveStage('client_review')} className="btn-primary" disabled={movingNext || !isNextReady}>
                {movingNext ? 'Approving...' : 'Approve & Send to Client'}
              </button>
              <button onClick={() => moveStage('estimation')} className="btn-danger" disabled={movingNext || !hasFeedback}>
                {movingNext ? 'Rejecting...' : 'Reject to Estimation'}
              </button>
            </>
          ) : (
            <button onClick={() => moveStage(nextAction.nextStatus)} className="btn-primary" disabled={movingNext || !isNextReady}>
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
