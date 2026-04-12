import React, { useState } from 'react';
import api from '../../services/api';

function TechnicalForm({ inquiry, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    system_type: '',
    feasibility: '',
    estimated_duration: '',
    technical_specs: '',
    remarks: '',
    decision: '',
    checklist: {
      requirement_audit: false,
      feasibility_validated: false,
      risks_documented: false,
      dependencies_confirmed: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const checklistItems = [
    { key: 'requirement_audit', label: 'Requirement audit completed' },
    { key: 'feasibility_validated', label: 'Feasibility validated' },
    { key: 'risks_documented', label: 'Key technical risks documented' },
    { key: 'dependencies_confirmed', label: 'Dependencies confirmed' }
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
      const parsedDuration = formData.estimated_duration === ''
        ? null
        : Number(formData.estimated_duration);
      await api.post('/technical/review', {
        inquiry_id: inquiry.id,
        system_type: formData.system_type,
        feasibility: formData.feasibility,
        estimated_duration: Number.isFinite(parsedDuration) ? parsedDuration : null,
        technical_specs: { notes: formData.technical_specs, checklist: formData.checklist },
        remarks: formData.remarks,
        decision: formData.decision
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit technical review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="gutmann-form" onSubmit={handleSubmit}>
      <h2>Technical Review — {inquiry?.inquiry_number}</h2>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label>System Type</label>
        <input name="system_type" value={formData.system_type} onChange={handleChange} placeholder="e.g. HVAC, Electrical, Plumbing" />
      </div>
      <div className="form-group">
        <label>Feasibility Assessment *</label>
        <select name="feasibility" value={formData.feasibility} onChange={handleChange} required>
          <option value="">Select feasibility</option>
          <option value="feasible">Feasible</option>
          <option value="feasible_with_conditions">Feasible with Conditions</option>
          <option value="not_feasible">Not Feasible</option>
        </select>
      </div>
      <div className="form-group">
        <label>Estimated Duration (days)</label>
        <input type="number" name="estimated_duration" value={formData.estimated_duration} onChange={handleChange} min="1" />
      </div>
      <div className="form-group">
        <label>Technical Specifications</label>
        <textarea name="technical_specs" value={formData.technical_specs} onChange={handleChange} rows={4} placeholder="Detail technical requirements..." />
      </div>
      <div className="form-section">
        <h3>Technical Checklist</h3>
        <p className="form-helper-text">Progress: {completedChecklist}/{checklistItems.length} completed</p>
        <div className="checklist-card-grid">
          {checklistItems.map((item) => (
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
            ✓ Approve for Estimation
          </button>
          <button
            type="button"
            className={`btn-decision ${formData.decision === 'rejected' ? 'active reject' : ''}`}
            onClick={() => setFormData({ ...formData, decision: 'rejected' })}
          >
            ✗ Reject to Sales
          </button>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading || !formData.decision || !formData.remarks.trim()}>
          {loading ? 'Submitting...' : 'Submit Technical Review'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default TechnicalForm;
