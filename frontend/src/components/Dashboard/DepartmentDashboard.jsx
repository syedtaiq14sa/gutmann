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

  const getDepartmentStatus = () => {
    switch(user?.role) {
      case 'qc': return 'qc_review';
      case 'technical': return 'technical_review';
      case 'estimation': return 'estimation';
      case 'supply_chain': return 'supply_chain';
      default: return null;
    }
  };

  const myProjects = projects.filter(p => p.status === getDepartmentStatus());

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
          <p className="kpi-value">{projects.length}</p>
        </div>
      </div>

      <div className="task-section">
        <h2>Projects Awaiting Your Review</h2>
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
    </div>
  );
}

export default DepartmentDashboard;
