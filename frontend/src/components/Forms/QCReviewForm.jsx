import React, { useRef, useState } from 'react';
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
  const [validationErrors, setValidationErrors] = useState({});
  const checklistRef = useRef(null);
  const remarksRef = useRef(null);
  const decisionRef = useRef(null);
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
        <div
          ref={checklistRef}
          tabIndex={-1}
          className={`checklist-card-grid ${validationErrors.checklist ? 'field-error-group' : ''}`}
        >
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
            ✓ Approve
          </button>
          <button
            type="button"
            className={`btn-decision ${formData.decision === 'rejected' ? 'active reject' : ''}`}
            onClick={() => {
              setFormData({ ...formData, decision: 'rejected' });
              clearValidationError('decision');
            }}
          >
            ✗ Reject
          </button>
        </div>
        {validationErrors.decision && <div className="field-error-text">{validationErrors.decision}</div>}
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
