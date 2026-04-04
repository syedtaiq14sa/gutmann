import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';

function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) return <div className="loading-spinner">Loading project...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="project-details">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn-secondary">← Back</button>
        <h1>{project.inquiry_number || project.id}</h1>
        <span className={`status-badge status-${project.status}`}>{project.status?.replace('_', ' ')}</span>
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
            {['received', 'qc_review', 'technical_review', 'estimation', 'ceo_approval', 'client_review', 'approved'].map(stage => (
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
    </div>
  );
}

export default ProjectDetails;
