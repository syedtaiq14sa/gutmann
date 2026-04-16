import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import InquiryForm from '../Forms/InquiryForm';
import api from '../../services/api';
import '../../styles/dashboard.css';

function SalesPersonDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [editingQuery, setEditingQuery] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inquiries', { params: { limit: 100 } });
      const list = (response.data?.data || []).filter((query) => query.created_by === user?.id);
      setQueries(list);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load queries' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchQueries();
  }, [user?.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowInquiryForm(false);
        setSelectedQuery(null);
        setEditingQuery(null);
      }
    };
    if (showInquiryForm || selectedQuery || editingQuery) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInquiryForm, selectedQuery, editingQuery]);

  const closeFormModal = () => {
    setShowInquiryForm(false);
    setEditingQuery(null);
  };

  const handleInquirySuccess = async () => {
    closeFormModal();
    setMessage({ type: 'success', text: editingQuery ? 'Query updated successfully' : 'Query created successfully' });
    await fetchQueries();
  };

  const handleDeleteQuery = async (query) => {
    if (!window.confirm(`Delete query ${query.inquiry_number || ''}? This action cannot be undone.`)) return;
    setDeletingId(query.id);
    try {
      await api.delete(`/inquiries/${query.id}`);
      setMessage({ type: 'success', text: 'Query deleted successfully' });
      if (selectedQuery?.id === query.id) setSelectedQuery(null);
      await fetchQueries();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to delete query' });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (query) => {
    setEditingQuery(query);
    setShowInquiryForm(false);
    setSelectedQuery(null);
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  const activeQueries = queries.filter((q) => !['approved', 'supply_chain', 'rejected'].includes(q.status));

  return (
    <div className="salesperson-dashboard">
      <div className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <button className="btn-primary" onClick={() => setShowInquiryForm(true)}>
          + Create New Query
        </button>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}

      {(showInquiryForm || editingQuery) && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <InquiryForm
              mode={editingQuery ? 'edit' : 'create'}
              initialData={editingQuery || {}}
              onSuccess={handleInquirySuccess}
              onCancel={closeFormModal}
            />
          </div>
        </div>
      )}

      {selectedQuery && (
        <div className="modal-overlay" onClick={() => setSelectedQuery(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Query Details</h2>
            <div className="query-detail-grid">
              <p><strong>Inquiry #:</strong> {selectedQuery.inquiry_number || '—'}</p>
              <p><strong>Client:</strong> {selectedQuery.client_name || '—'}</p>
              <p><strong>Email:</strong> {selectedQuery.client_email || '—'}</p>
              <p><strong>Phone:</strong> {selectedQuery.client_phone || '—'}</p>
              <p><strong>Company:</strong> {selectedQuery.client_company || '—'}</p>
              <p><strong>Type:</strong> {selectedQuery.project_type || '—'}</p>
              <p><strong>Priority:</strong> {selectedQuery.priority || '—'}</p>
              <p><strong>Status:</strong> {selectedQuery.status?.replace('_', ' ') || '—'}</p>
              <p><strong>Location:</strong> {selectedQuery.location || '—'}</p>
              <p><strong>Budget:</strong> {selectedQuery.budget_range || '—'}</p>
              <p className="query-detail-description"><strong>Description:</strong> {selectedQuery.project_description || '—'}</p>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setSelectedQuery(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>My Queries</h3>
          <p className="kpi-value">{queries.length}</p>
        </div>
        <div className="kpi-card alert">
          <h3>Rejected</h3>
          <p className="kpi-value">{queries.filter((q) => q.status === 'rejected').length}</p>
        </div>
        <div className="kpi-card success">
          <h3>Approved</h3>
          <p className="kpi-value">{queries.filter((q) => q.status === 'approved').length}</p>
        </div>
        <div className="kpi-card warning">
          <h3>Active</h3>
          <p className="kpi-value">{activeQueries.length}</p>
        </div>
      </div>

      <div className="projects-table-section">
        <h2>My Queries</h2>
        {queries.length === 0 ? (
          <p className="empty-state">No queries found. Create your first query to get started.</p>
        ) : (
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
            {queries.map(query => (
              <tr key={query.id}>
                <td>{query.inquiry_number}</td>
                <td>{query.client_name}</td>
                <td><span className={`status-badge status-${query.status}`}>{query.status?.replace('_', ' ')}</span></td>
                <td>{new Date(query.created_at).toLocaleDateString()}</td>
                <td className="query-action-buttons">
                  <button onClick={() => setSelectedQuery(query)} className="btn-primary btn-sm">View</button>
                  <button onClick={() => openEditModal(query)} className="btn-secondary btn-sm">Edit</button>
                  <button
                    onClick={() => handleDeleteQuery(query)}
                    className="btn-danger btn-sm"
                    disabled={deletingId === query.id}
                  >
                    {deletingId === query.id ? 'Deleting...' : 'Delete'}
                  </button>
                  {query.status === 'received' && (
                    <button
                      onClick={() => navigate(`/projects/${query.id}`)}
                      className="btn-secondary btn-sm"
                    >
                      Open Workflow
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SalesPersonDashboard;
