import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardData } from '../../store/projectSlice';
import '../../styles/dashboard.css';

function SalesPersonDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading } = useSelector(state => state.projects);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const myProjects = projects.filter(p => p.assigned_salesperson_id === 'me');

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="salesperson-dashboard">
      <h1>Sales Dashboard</h1>
      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>My Projects</h3>
          <p className="kpi-value">{projects.length}</p>
        </div>
        <div className="kpi-card success">
          <h3>Won</h3>
          <p className="kpi-value">{projects.filter(p => p.status === 'approved').length}</p>
        </div>
        <div className="kpi-card warning">
          <h3>Pending</h3>
          <p className="kpi-value">{projects.filter(p => !['approved', 'rejected'].includes(p.status)).length}</p>
        </div>
      </div>

      <div className="projects-table-section">
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
