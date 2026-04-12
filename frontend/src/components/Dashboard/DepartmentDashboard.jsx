import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData } from '../../store/projectSlice';
import '../../styles/dashboard.css';

function DepartmentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading } = useSelector(state => state.projects);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

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

  const getDepartmentStatus = () => {
    switch(user?.role) {
      case 'qc': return 'qc_review';
      case 'technical': return 'technical_review';
      case 'estimation': return 'estimation';
      case 'supply_chain': return 'supply_chain';
      default: return null;
    }
  };

  const roleStage = getDepartmentStatus();
  const roleRank = STAGE_ORDER.indexOf(roleStage);
  const classify = (status) => {
    if (['sales_followup', 'rejected'].includes(status)) return 'rejected';
    const rank = STAGE_ORDER.indexOf(status);
    if (rank === roleRank || rank === roleRank + 1) return 'active';
    if (rank > roleRank + 1) return 'completed';
    return 'active';
  };

  const visibleProjects = projects.filter((project) => {
    if (user?.role === 'supply_chain') return project.status === 'supply_chain';
    return roleRank !== -1 && STAGE_ORDER.indexOf(project.status) >= roleRank - 1;
  });

  const myProjects = visibleProjects.filter(p => classify(p.status) === 'active');
  const completedProjects = visibleProjects.filter(p => classify(p.status) === 'completed');
  const rejectedProjects = visibleProjects.filter(p => classify(p.status) === 'rejected');

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="department-dashboard">
      <h1>{user?.role?.toUpperCase()} Department Dashboard</h1>
      <div className="kpi-cards">
        <div className="kpi-card alert">
          <h3>Pending Review</h3>
          <p className="kpi-value">{myProjects.length}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Projects</h3>
          <p className="kpi-value">{visibleProjects.length}</p>
        </div>
        <div className="kpi-card success">
          <h3>Completed by Dept</h3>
          <p className="kpi-value">{completedProjects.length}</p>
        </div>
        <div className="kpi-card warning">
          <h3>Rejected</h3>
          <p className="kpi-value">{rejectedProjects.length}</p>
        </div>
      </div>

      <div className="task-section">
        <h2>Active (Action Required)</h2>
        {myProjects.length === 0 ? (
          <p className="empty-state">No projects pending review ✅</p>
        ) : (
          <div className="task-list">
            {myProjects.map(project => (
              <div key={project.id} className="task-card" onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="task-header">
                  <span>{project.inquiry_number}</span>
                  {project.bottleneck_flag && <span className="bottleneck-badge">⚠️ Urgent</span>}
                </div>
                <p>{project.client_name}</p>
                <p>Received: {new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="task-section" style={{ marginTop: '16px' }}>
        <h2>Completed (Read-only Tracking)</h2>
        {completedProjects.length === 0 ? (
          <p className="empty-state">No completed items yet.</p>
        ) : (
          <div className="task-list">
            {completedProjects.slice(0, 8).map(project => (
              <div key={project.id} className="task-card priority-low" onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="task-header">
                  <span>{project.inquiry_number}</span>
                  <span className="priority-badge priority-low">completed</span>
                </div>
                <p>{project.client_name}</p>
                <p>Current Stage: {project.status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="task-section" style={{ marginTop: '16px' }}>
        <h2>Rejected (Sent to Sales)</h2>
        {rejectedProjects.length === 0 ? (
          <p className="empty-state">No rejected items.</p>
        ) : (
          <div className="task-list">
            {rejectedProjects.slice(0, 8).map(project => (
              <div key={project.id} className="task-card priority-medium" onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="task-header">
                  <span>{project.inquiry_number}</span>
                  <span className="priority-badge priority-medium">rejected</span>
                </div>
                <p>{project.client_name}</p>
                <p>Current Stage: {project.status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentDashboard;
