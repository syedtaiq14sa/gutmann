import React, { useState } from 'react';
import api from '../../services/api';

function ClientNegotiationForm({ inquiry, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    action: '',
    message: '',
    counter_offer: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.action) {
      setError('Please select an action');
      return;
    }
    setLoading(true);
    setError('');
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
        <div className="decision-buttons">
          {[
            { value: 'accept', label: '✓ Accept Quote', className: 'approve' },
            { value: 'reject', label: '✗ Reject Quote', className: 'reject' },
            { value: 'negotiate', label: '↔ Negotiate', className: 'negotiate' }
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`btn-decision ${formData.action === opt.value ? `active ${opt.className}` : ''}`}
              onClick={() => setFormData({ ...formData, action: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {formData.action === 'negotiate' && (
        <div className="form-group">
          <label>Counter Offer (USD)</label>
          <input
            type="number"
            name="counter_offer"
            value={formData.counter_offer}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Your proposed price"
          />
        </div>
      )}

      <div className="form-group">
        <label>Message / Notes</label>
        <textarea name="message" value={formData.message} onChange={handleChange} rows={3} />
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
