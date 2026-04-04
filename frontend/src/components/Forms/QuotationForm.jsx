import React, { useState } from 'react';
import api from '../../services/api';

function QuotationForm({ inquiry, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    estimated_cost: '',
    final_price: '',
    validity_days: 30,
    payment_terms: '',
    scope_of_work: '',
    exclusions: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const profitMargin = formData.estimated_cost && formData.final_price
    ? (((parseFloat(formData.final_price) - parseFloat(formData.estimated_cost)) / parseFloat(formData.estimated_cost)) * 100).toFixed(1)
    : null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/estimation/quotation', {
        inquiry_id: inquiry.id,
        estimated_cost: parseFloat(formData.estimated_cost),
        final_price: parseFloat(formData.final_price),
        validity_days: parseInt(formData.validity_days),
        payment_terms: formData.payment_terms,
        scope_of_work: formData.scope_of_work,
        exclusions: formData.exclusions,
        notes: formData.notes
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="gutmann-form" onSubmit={handleSubmit}>
      <h2>Create Quotation — {inquiry?.inquiry_number}</h2>
      {error && <div className="form-error">{error}</div>}

      <div className="form-row">
        <div className="form-group">
          <label>Estimated Cost (USD) *</label>
          <input type="number" name="estimated_cost" value={formData.estimated_cost} onChange={handleChange} min="0" step="0.01" required />
        </div>
        <div className="form-group">
          <label>Final Price (USD) *</label>
          <input type="number" name="final_price" value={formData.final_price} onChange={handleChange} min="0" step="0.01" required />
        </div>
      </div>

      {profitMargin !== null && (
        <div className={`profit-margin ${parseFloat(profitMargin) < 10 ? 'low' : parseFloat(profitMargin) > 40 ? 'high' : 'good'}`}>
          Profit Margin: <strong>{profitMargin}%</strong>
          {parseFloat(profitMargin) < 10 && ' ⚠ Below minimum (10%)'}
        </div>
      )}

      <div className="form-group">
        <label>Validity (days)</label>
        <input type="number" name="validity_days" value={formData.validity_days} onChange={handleChange} min="1" />
      </div>
      <div className="form-group">
        <label>Payment Terms</label>
        <input name="payment_terms" value={formData.payment_terms} onChange={handleChange} placeholder="e.g. 30% upfront, 70% on completion" />
      </div>
      <div className="form-group">
        <label>Scope of Work</label>
        <textarea name="scope_of_work" value={formData.scope_of_work} onChange={handleChange} rows={4} />
      </div>
      <div className="form-group">
        <label>Exclusions</label>
        <textarea name="exclusions" value={formData.exclusions} onChange={handleChange} rows={2} />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Quotation'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

export default QuotationForm;
