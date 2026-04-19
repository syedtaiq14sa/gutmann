import React, { useRef, useState } from 'react';
import api from '../../services/api';

function ClientNegotiationForm({ inquiry, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    action: '',
    message: '',
    counter_offer: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const actionRef = useRef(null);
  const counterOfferRef = useRef(null);
  const messageRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationErrors((prev) => {
      if (!prev[e.target.name]) return prev;
      const next = { ...prev };
      delete next[e.target.name];
      return next;
    });
  };

  const focusFirstError = (errors) => {
    const order = ['action', 'counter_offer', 'message'];
    const refs = {
      action: actionRef,
      counter_offer: counterOfferRef,
      message: messageRef
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
    if (!formData.action) {
      errors.action = 'This field is required.';
    }
    if (['negotiate', 'reject'].includes(formData.action) && !formData.message.trim()) {
      errors.message = 'This field is required.';
    }
    if (formData.action === 'negotiate') {
      const parsed = Number(formData.counter_offer);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        errors.counter_offer = 'Enter a valid value greater than 0.';
      }
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
      const endpoint = `/client/${inquiry.id}/${formData.action}`;
      const payload = formData.action === 'negotiate'
        ? { message: formData.message, counter_offer: parseFloat(formData.counter_offer) || null }
        : { notes: formData.message };

      await api.post(endpoint, payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const currentQuote = inquiry?.quotations?.[0]?.final_price;

  return (
    <form className="gutmann-form" onSubmit={handleSubmit}>
      <h2>Client Response — {inquiry?.inquiry_number}</h2>

      {currentQuote && (
        <div className="quote-summary">
          <span>Quoted Price:</span>
          <strong>${Number(currentQuote).toLocaleString()}</strong>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label>Your Decision *</label>
        <div ref={actionRef} tabIndex={-1} className={`decision-buttons ${validationErrors.action ? 'field-error-group' : ''}`}>
          {[
            { value: 'accept', label: '✓ Accept Quote', className: 'approve' },
            { value: 'reject', label: '✗ Reject Quote', className: 'reject' },
            { value: 'negotiate', label: '↔ Negotiate', className: 'negotiate' }
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`btn-decision ${formData.action === opt.value ? `active ${opt.className}` : ''}`}
              onClick={() => {
                setFormData({ ...formData, action: opt.value });
                setValidationErrors((prev) => {
                  if (!prev.action) return prev;
                  const next = { ...prev };
                  delete next.action;
                  return next;
                });
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {validationErrors.action && <div className="field-error-text">{validationErrors.action}</div>}
      </div>

      {formData.action === 'negotiate' && (
        <div className="form-group">
          <label>Counter Offer (USD)</label>
          <input
            ref={counterOfferRef}
            type="number"
            name="counter_offer"
            value={formData.counter_offer}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={validationErrors.counter_offer ? 'input-error' : ''}
            placeholder="Your proposed price"
          />
          {validationErrors.counter_offer && <div className="field-error-text">{validationErrors.counter_offer}</div>}
        </div>
      )}

      <div className="form-group">
        <label>Message / Notes</label>
        <textarea
          ref={messageRef}
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          className={validationErrors.message ? 'input-error' : ''}
        />
        {validationErrors.message && <div className="field-error-text">{validationErrors.message}</div>}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading || !formData.action}>
          {loading ? 'Submitting...' : 'Submit Response'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default ClientNegotiationForm;
