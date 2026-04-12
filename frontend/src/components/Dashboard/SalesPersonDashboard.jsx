import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData } from '../../store/projectSlice';
import InquiryForm from '../Forms/InquiryForm';
import api from '../../services/api';
import '../../styles/dashboard.css';

function SalesPersonDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading } = useSelector(state => state.projects);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [sendingToQC, setSendingToQC] = useState(null);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowInquiryForm(false);
    };
    if (showInquiryForm) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInquiryForm]);

  const handleInquirySuccess = () => {
    setShowInquiryForm(false);
    dispatch(fetchDashboardData());
  };

  const handleSendToQC = async (projectId) => {
    setSendingToQC(projectId);
    try {
      await api.put(`/inquiries/${projectId}/stage`, { new_status: 'qc_review' });
      dispatch(fetchDashboardData());
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send to QC');
    } finally {
      setSendingToQC(null);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  const rejectedProjects = projects.filter((p) => p.status === 'sales_followup' || p.status === 'rejected');
  const completedProjects = projects.filter((p) => ['approved', 'supply_chain'].includes(p.status));
  const activeProjects = projects.filter((p) => !['approved', 'supply_chain', 'sales_followup', 'rejected'].includes(p.status));

  return (
    <div className="salesperson-dashboard">
      <div className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <button className="btn-primary" onClick={() => setShowInquiryForm(true)}>
          + Add New Inquiry
        </button>
      </div>

      {showInquiryForm && (
        <div className="modal-overlay" onClick={() => setShowInquiryForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <InquiryForm
              onSuccess={handleInquirySuccess}
              onCancel={() => setShowInquiryForm(false)}
            />
          </div>
        </div>
      )}
      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>My Projects</h3>
          <p className="kpi-value">{projects.length}</p>
        </div>
        <div className="kpi-card alert">
          <h3>Rejected Follow-ups</h3>
          <p className="kpi-value">{rejectedProjects.length}</p>
        </div>
        <div className="kpi-card success">
          <h3>Completed</h3>
          <p className="kpi-value">{completedProjects.length}</p>
        </div>
        <div className="kpi-card warning">
          <h3>Active</h3>
          <p className="kpi-value">{activeProjects.length}</p>
        </div>
      </div>

      <div className="projects-table-section">
        <h2>Rejected Queries (Central Follow-up)</h2>
        {rejectedProjects.length === 0 ? (
          <p className="empty-state">No rejected queries assigned to Sales.</p>
        ) : (
          <table className="data-table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Inquiry #</th>
                <th>Client</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rejectedProjects.slice(0, 10).map(project => (
                <tr key={project.id}>
                  <td>{project.inquiry_number}</td>
                  <td>{project.client_name}</td>
                  <td><span className={`status-badge status-${project.status}`}>{project.status?.replace('_', ' ')}</span></td>
                  <td>{new Date(project.updated_at || project.created_at).toLocaleString()}</td>
                  <td>
                    <button onClick={() => navigate(`/projects/${project.id}`)} className="btn-primary btn-sm">Open Follow-up</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>Recent Projects</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Inquiry #</th>
              <th>Client</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.slice(0, 10).map(project => (
              <tr key={project.id}>
                <td>{project.inquiry_number}</td>
                <td>{project.client_name}</td>
                <td><span className={`status-badge status-${project.status}`}>{project.status?.replace('_', ' ')}</span></td>
                <td>{new Date(project.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate(`/projects/${project.id}`)} className="btn-primary btn-sm">View</button>
                  {project.status === 'received' && (
                    <button
                      onClick={() => handleSendToQC(project.id)}
                      className="btn-secondary btn-sm"
                      disabled={sendingToQC === project.id}
                      style={{ marginLeft: '8px' }}
                    >
                      {sendingToQC === project.id ? 'Sending...' : 'Send to QC'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SalesPersonDashboard;
