import React, { useState } from 'react';
import api from '../../services/api';

function QCReviewForm({ inquiry, titleId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    decision: '',
    remarks: '',
    checklist: {
      documents_complete: false,
      site_survey_required: false,
      client_info_verified: false,
      scope_clear: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const checklistItems = [
    { key: 'documents_complete', label: 'All documents are complete' },
    { key: 'site_survey_required', label: 'Site survey required' },
    { key: 'client_info_verified', label: 'Client information verified' },
    { key: 'scope_clear', label: 'Project scope is clear' }
  ];
  const completedChecklist = checklistItems.filter((item) => formData.checklist[item.key]).length;
  const allChecklistDone = completedChecklist === checklistItems.length;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChecklistChange = (e) => {
    setFormData({
      ...formData,
      checklist: { ...formData.checklist, [e.target.name]: e.target.checked }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.decision) {
      setError('Please select a decision');
      return;
    }
    if (!formData.remarks.trim()) {
      setError('Feedback remarks are mandatory');
      return;
    }
    if (formData.decision === 'approved' && !allChecklistDone) {
      setError('Complete all checklist items before approving');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/qc/review', {
        inquiry_id: inquiry.id,
        decision: formData.decision,
        remarks: formData.remarks,
        checklist: formData.checklist
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit QC review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="gutmann-form" onSubmit={handleSubmit}>
      <h2 id={titleId}>QC Review — {inquiry?.inquiry_number}</h2>
      {error && <div className="form-error">{error}</div>}

      <div className="form-section">
        <h3>QC Checklist</h3>
        <p className="form-helper-text">Progress: {completedChecklist}/{checklistItems.length} completed</p>
        <div className="checklist-card-grid">
          {checklistItems.map(item => (
            <div key={item.key} className="checklist-card-item">
              <div className="form-checkbox">
            <input
              type="checkbox"
              id={item.key}
              name={item.key}
              checked={formData.checklist[item.key]}
              onChange={handleChecklistChange}
            />
                <label htmlFor={item.key}>{item.label}</label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Remarks *</label>
        <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} />
      </div>

      <div className="form-group">
        <label>Decision *</label>
        <div className="decision-buttons">
          <button
            type="button"
            className={`btn-decision ${formData.decision === 'approved' ? 'active approve' : ''}`}
            onClick={() => setFormData({ ...formData, decision: 'approved' })}
          >
            ✓ Approve
          </button>
          <button
            type="button"
            className={`btn-decision ${formData.decision === 'rejected' ? 'active reject' : ''}`}
            onClick={() => setFormData({ ...formData, decision: 'rejected' })}
          >
            ✗ Reject
          </button>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading || !formData.decision || !formData.remarks.trim()}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default QCReviewForm;
