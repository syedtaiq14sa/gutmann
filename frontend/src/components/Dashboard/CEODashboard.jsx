import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../store/projectSlice';
import StageTracker from './StageTracker';
import '../../styles/dashboard.css';

function CEODashboard() {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector(state => state.projects);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const totalProjects = projects.length;
  const totalRevenue = projects.reduce((sum, p) => sum + (p.quotation?.final_price || 0), 0);
  const approvedCount = projects.filter(p => p.status === 'approved').length;
  const bottlenecks = projects.filter(p => p.bottleneck_flag).length;

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;

  return (
    <div className="ceo-dashboard">
      <h1>Executive Dashboard</h1>
      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>Total Projects</h3>
          <p className="kpi-value">{totalProjects}</p>
        </div>
        <div className="kpi-card">
          <h3>Revenue Pipeline</h3>
          <p className="kpi-value">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="kpi-card success">
          <h3>Approved</h3>
          <p className="kpi-value">{approvedCount}</p>
        </div>
        <div className="kpi-card alert">
          <h3>Bottlenecks</h3>
          <p className="kpi-value">{bottlenecks}</p>
        </div>
      </div>
      <StageTracker projects={projects} />
    </div>
  );
}

export default CEODashboard;
