import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import QCReviewForm from '../components/Forms/QCReviewForm';

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

  const checklist = requirements.checklist.reduce((acc, item) => {
    acc[item.key] = false;
    return acc;
  }, {});

  return {
    checklist,
    feedback: '',
    estimated_cost: '',
    final_price: '',
    client_response: ''
  };
};

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [project, setProject] = useState(null);
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
    if (showQCReviewForm) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQCReviewForm]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data);
      } catch (err) {
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    setStageInput(createStageInputState(project?.status));
  }, [project?.status]);

  const handleSendToQC = async () => {
    setSendingToQC(true);
    try {
      await api.put(`/inquiries/${id}/stage`, { new_status: 'qc_review' });
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
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

  const handleNext = async () => {
    const action = getNextAction();
    if (!action) return;
    const estimatedCostValue = stageInput.estimated_cost === '' ? null : Number(stageInput.estimated_cost);
    const finalPriceValue = stageInput.final_price === '' ? null : Number(stageInput.final_price);

    setMovingNext(true);
    setError('');
    try {
      await api.put(`/inquiries/${id}/stage`, {
        new_status: action.nextStatus,
        checklist: stageInput.checklist,
        feedback: stageInput.feedback,
        estimated_cost: Number.isFinite(estimatedCostValue) ? estimatedCostValue : null,
        final_price: Number.isFinite(finalPriceValue) ? finalPriceValue : null,
        client_response: stageInput.client_response
      });
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
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

  if (loading) return <div className="loading-spinner">Loading project...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="project-details">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn-secondary">← Back</button>
        <h1>{project.inquiry_number || project.id}</h1>
        <span className={`status-badge status-${project.status}`}>{project.status?.replace('_', ' ')}</span>
        {user?.role === 'salesperson' && project.status === 'received' && (
          <button
            onClick={handleSendToQC}
            className="btn-primary"
            disabled={sendingToQC}
            style={{ marginLeft: '16px' }}
          >
            {sendingToQC ? 'Sending...' : 'Send to QC'}
          </button>
        )}
        {user?.role === 'qc' && project.status === 'qc_review' && (
          <button
            onClick={() => setShowQCReviewForm(true)}
            className="btn-primary"
            style={{ marginLeft: '16px' }}
          >
            Review / Approve
          </button>
        )}
        {nextAction && (
          <button
            onClick={handleNext}
            className="btn-primary"
            disabled={movingNext || !isNextReady}
            style={{ marginLeft: '16px' }}
          >
            {movingNext ? 'Moving...' : 'Next'}
          </button>
        )}
      </div>

      {nextAction && stageRequirements && (
        <div className="detail-card" style={{ marginBottom: '16px' }}>
          <h3>Mandatory Completion Before Next Stage</h3>

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
                  placeholder="Enter estimated cost"
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
                  placeholder="Enter final price"
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
              placeholder="Provide required stage feedback/comments"
            />
          </div>
        </div>
      )}

      <div className="details-grid">
        <div className="detail-card">
          <h3>Project Information</h3>
          <p><strong>Client:</strong> {project.client_name}</p>
          <p><strong>Description:</strong> {project.project_description}</p>
          <p><strong>Location:</strong> {project.location}</p>
          <p><strong>Created:</strong> {new Date(project.created_at).toLocaleDateString()}</p>
        </div>

        <div className="detail-card">
          <h3>Workflow Stage</h3>
          <div className="workflow-stages">
            {['received', 'qc_review', 'technical_review', 'estimation', 'ceo_approval', 'client_review', 'approved', 'supply_chain'].map(stage => (
              <div key={stage} className={`stage-item ${project.status === stage ? 'active' : ''}`}>
                {stage.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>

        {project.quotation && (
          <div className="detail-card">
            <h3>Quotation</h3>
            <p><strong>Estimated Cost:</strong> ${project.quotation.estimated_cost?.toLocaleString()}</p>
            <p><strong>Final Price:</strong> ${project.quotation.final_price?.toLocaleString()}</p>
            <p><strong>Status:</strong> {project.quotation.status}</p>
          </div>
        )}
      </div>
      {showQCReviewForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="qc-review-title">
          <div className="modal-content">
            <QCReviewForm
              inquiry={project}
              titleId="qc-review-title"
              onSuccess={async () => {
                setShowQCReviewForm(false);
                try {
                  const response = await api.get(`/projects/${id}`);
                  setProject(response.data);
                } catch (err) {
                  setError('Review submitted, but failed to refresh project data.');
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
