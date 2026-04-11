import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import QCReviewForm from '../components/Forms/QCReviewForm';

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

    setMovingNext(true);
    setError('');
    try {
      await api.put(`/inquiries/${id}/stage`, { new_status: action.nextStatus });
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move to next stage');
    } finally {
      setMovingNext(false);
    }
  };

  const nextAction = getNextAction();

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
            disabled={movingNext}
            style={{ marginLeft: '16px' }}
          >
            {movingNext ? 'Moving...' : 'Next'}
          </button>
        )}
      </div>

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
