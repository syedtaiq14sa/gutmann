import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../store/projectSlice';
import StageTracker from './StageTracker';
import api from '../../services/api';
import '../../styles/dashboard.css';

function CEODashboard() {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector(state => state.projects);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/ceo/analytics');
        setAnalytics(response.data);
      } catch (_err) {
        setAnalytics(null);
      }
    };
    fetchAnalytics();
  }, []);

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
        <div className="kpi-card warning">
          <h3>Avg Turnaround (hrs)</h3>
          <p className="kpi-value">{analytics?.overallTurnaroundAvgHours || 0}</p>
        </div>
      </div>
      <StageTracker projects={projects} />
      <div className="stage-tracker">
        <h2>Department Avg Processing Time</h2>
        {!analytics?.departmentAverageTimeHours?.length ? (
          <p className="empty-state">No timing data yet.</p>
        ) : (
          <div className="activity-timeline">
            {analytics.departmentAverageTimeHours.map((item) => (
              <div key={item.stage} className="activity-item">
                <div className="activity-head">
                  <strong>{item.stage.replace('_', ' ')}</strong>
                  <span>{item.average_hours} hrs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CEODashboard;
