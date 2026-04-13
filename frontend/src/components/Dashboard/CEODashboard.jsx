import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../store/projectSlice';
import StageTracker from './StageTracker';
import api from '../../services/api';
import '../../styles/dashboard.css';

const NOTES_BY_DECISION = {
  approved: 'Approved by CEO',
  rejected: 'Rejected by CEO'
};
const DECISIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

function CEODashboard() {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector(state => state.projects);
  const [analytics, setAnalytics] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const fetchPendingApprovals = async () => {
    try {
      const response = await api.get('/ceo/pending');
      setPendingApprovals(response.data || []);
    } catch (_err) {
      setPendingApprovals([]);
    }
  };

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
    fetchPendingApprovals();
  }, []);

  const handleDecision = async (inquiryId, decision) => {
    try {
      setProcessingId(inquiryId);
      setActionError('');
      await api.post('/ceo/approve', {
        inquiry_id: inquiryId,
        decision,
        notes: NOTES_BY_DECISION[decision] || `CEO decision: ${decision}`
      });
      await Promise.all([
        dispatch(fetchDashboardData()),
        fetchPendingApprovals()
      ]);
    } catch (err) {
      setActionError(err?.response?.data?.error || 'Failed to process CEO decision');
    } finally {
      setProcessingId(null);
    }
  };

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
      <div className="task-section" style={{ marginBottom: '24px' }}>
        <h2>Pending CEO Approvals</h2>
        {actionError && <p className="error-text">{actionError}</p>}
        {pendingApprovals.length === 0 ? (
          <p className="empty-state">No approvals pending ✅</p>
        ) : (
          <div className="task-list">
            {pendingApprovals.map((project) => {
              const inquiryId = project.id;
              const firstQuotation = project.quotations?.[0];
              const isProcessing = processingId === inquiryId;
              return (
                <div key={inquiryId} className="task-card priority-high">
                  <div className="task-header">
                    <span>{project.inquiry_number || `Inquiry #${project.id}`}</span>
                    <span className="priority-badge priority-high">approval needed</span>
                  </div>
                  <p>{project.client_name || 'Unknown Client'}</p>
                  <p>Quoted Price: ${(firstQuotation?.final_price || 0).toLocaleString()}</p>
                  <div className="ceo-action-buttons">
                    <button
                      onClick={() => handleDecision(inquiryId, DECISIONS.APPROVED)}
                      className="btn-primary btn-sm"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleDecision(inquiryId, DECISIONS.REJECTED)}
                      className="btn-danger btn-sm"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
