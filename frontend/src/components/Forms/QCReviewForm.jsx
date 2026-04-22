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
    { key: 'documents_complete', label: 'All documents are complete', icon: '📄' },
    { key: 'site_survey_required', label: 'Site survey required', icon: '📍' },
    { key: 'client_info_verified', label: 'Client information verified', icon: '👤' },
    { key: 'scope_clear', label: 'Project scope is clear', icon: '🎯' }
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
    <form className="gutmann-form qc-review-form" onSubmit={handleSubmit}>
      <div className="qc-form-header">
        <h2 id={titleId}>QC Review — {inquiry?.inquiry_number}</h2>
        <div className="qc-progress-indicator">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(completedChecklist / checklistItems.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">{completedChecklist}/{checklistItems.length} completed</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="qc-form-body">
        <div className="form-section qc-checklist-section">
          <div className="section-header">
            <h3>📋 QC Checklist</h3>
            <p className="section-description">Complete all items before approving</p>
          </div>

          <div
            ref={checklistRef}
            tabIndex={-1}
            className={`qc-checklist-grid ${validationErrors.checklist ? 'field-error-group' : ''}`}
          >
            {checklistItems.map(item => (
              <div key={item.key} className={`qc-checklist-item ${formData.checklist[item.key] ? 'completed' : ''}`}>
                <label className="qc-checkbox-wrapper">
                  <input
                    type="checkbox"
                    name={item.key}
                    checked={formData.checklist[item.key]}
                    onChange={handleChecklistChange}
                    className="qc-checkbox"
                  />
                  <div className="qc-checkbox-display">
                    <span className="qc-item-icon">{item.icon}</span>
                    <span className="qc-item-text">{item.label}</span>
                    <span className="qc-checkmark">✓</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
          {validationErrors.checklist && <div className="field-error-text">{validationErrors.checklist}</div>}
        </div>

        <div className="form-section qc-remarks-section">
          <div className="section-header">
            <h3>💬 Review Remarks</h3>
            <p className="section-description">Provide detailed feedback for this review</p>
          </div>
          <div className="form-group">
            <textarea
              ref={remarksRef}
              name="remarks"
              value={formData.remarks}
              onChange={(e) => {
                handleChange(e);
                clearValidationError('remarks');
              }}
              rows={4}
              placeholder="Enter your review comments and observations..."
              className={`qc-textarea ${validationErrors.remarks ? 'input-error' : ''}`}
            />
            {validationErrors.remarks && <div className="field-error-text">{validationErrors.remarks}</div>}
          </div>
        </div>

        <div className="form-section qc-decision-section">
          <div className="section-header">
            <h3>⚖️ Final Decision</h3>
            <p className="section-description">Make your approval or rejection decision</p>
          </div>

          <div ref={decisionRef} tabIndex={-1} className={`qc-decision-buttons ${validationErrors.decision ? 'field-error-group' : ''}`}>
            <button
              type="button"
              className={`qc-decision-btn approve ${formData.decision === 'approved' ? 'active' : ''}`}
              onClick={() => {
                setFormData({ ...formData, decision: 'approved' });
                clearValidationError('decision');
              }}
              disabled={!allChecklistDone}
            >
              <span className="decision-icon">✓</span>
              <span className="decision-text">Approve</span>
              <span className="decision-subtext">Send to Technical</span>
            </button>
            <button
              type="button"
              className={`qc-decision-btn reject ${formData.decision === 'rejected' ? 'active' : ''}`}
              onClick={() => {
                setFormData({ ...formData, decision: 'rejected' });
                clearValidationError('decision');
              }}
            >
              <span className="decision-icon">✗</span>
              <span className="decision-text">Reject</span>
              <span className="decision-subtext">Send to Sales</span>
            </button>
          </div>
          {validationErrors.decision && <div className="field-error-text">{validationErrors.decision}</div>}
        </div>
      </div>

      <div className="qc-form-actions">
        <button type="submit" className="qc-submit-btn" disabled={loading || !formData.decision || !formData.remarks.trim()}>
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Submitting Review...
            </>
          ) : (
            <>
              <span className="submit-icon">📤</span>
              Submit Review
            </>
          )}
        </button>
        {onCancel && (
          <button type="button" className="qc-cancel-btn" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default QCReviewForm;
