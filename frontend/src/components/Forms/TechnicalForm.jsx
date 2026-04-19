import React, { useRef, useState } from 'react';
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
  const [validationErrors, setValidationErrors] = useState({});
  const checklistRef = useRef(null);
  const remarksRef = useRef(null);
  const decisionRef = useRef(null);
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
    setValidationErrors((prev) => {
      if (!prev.checklist) return prev;
      const next = { ...prev };
      delete next.checklist;
      return next;
    });
  };

  const clearValidationError = (field) => {
    setValidationErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const focusFirstError = (errors) => {
    const order = ['checklist', 'remarks', 'decision'];
    const refs = {
      checklist: checklistRef,
      remarks: remarksRef,
      decision: decisionRef
    };
    const first = order.find((field) => errors[field]);
    if (!first || !refs[first]?.current) return;
    refs[first].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof refs[first].current.focus === 'function') {
      refs[first].current.focus();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.decision) {
      errors.decision = 'This field is required.';
    }
    if (!formData.remarks.trim()) {
      errors.remarks = 'This field is required.';
    }
    if (formData.decision === 'approved' && !allChecklistDone) {
      errors.checklist = 'Please complete all checklist items before approving.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the highlighted fields.');
      focusFirstError(errors);
      return;
    }
    setLoading(true);
    setError('');
    setValidationErrors({});
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
        <div
          ref={checklistRef}
          tabIndex={-1}
          className={`checklist-card-grid ${validationErrors.checklist ? 'field-error-group' : ''}`}
        >
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
        {validationErrors.checklist && <div className="field-error-text">{validationErrors.checklist}</div>}
      </div>
      <div className="form-group">
        <label>Remarks *</label>
        <textarea
          ref={remarksRef}
          name="remarks"
          value={formData.remarks}
          onChange={(e) => {
            handleChange(e);
            clearValidationError('remarks');
          }}
          rows={3}
          className={validationErrors.remarks ? 'input-error' : ''}
        />
        {validationErrors.remarks && <div className="field-error-text">{validationErrors.remarks}</div>}
      </div>

      <div className="form-group">
        <label>Decision *</label>
        <div ref={decisionRef} tabIndex={-1} className={`decision-buttons ${validationErrors.decision ? 'field-error-group' : ''}`}>
          <button
            type="button"
            className={`btn-decision ${formData.decision === 'approved' ? 'active approve' : ''}`}
            onClick={() => {
              setFormData({ ...formData, decision: 'approved' });
              clearValidationError('decision');
            }}
          >
            ✓ Approve for Estimation
          </button>
          <button
            type="button"
            className={`btn-decision ${formData.decision === 'rejected' ? 'active reject' : ''}`}
            onClick={() => {
              setFormData({ ...formData, decision: 'rejected' });
              clearValidationError('decision');
            }}
          >
            ✗ Reject to Sales
          </button>
        </div>
        {validationErrors.decision && <div className="field-error-text">{validationErrors.decision}</div>}
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
