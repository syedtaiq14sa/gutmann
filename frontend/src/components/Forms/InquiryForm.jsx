import React, { useState } from 'react';
import api from '../../services/api';

function InquiryForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',
    project_type: '',
    project_description: '',
    location: '',
    budget_range: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/inquiries', formData);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="gutmann-form" onSubmit={handleSubmit}>
      <h2>New Inquiry</h2>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label>Client Name *</label>
        <input name="client_name" value={formData.client_name} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Client Email *</label>
        <input type="email" name="client_email" value={formData.client_email} onChange={handleChange} required />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input name="client_phone" value={formData.client_phone} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Company</label>
        <input name="client_company" value={formData.client_company} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Project Type *</label>
        <select name="project_type" value={formData.project_type} onChange={handleChange} required>
          <option value="">Select type</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="industrial">Industrial</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="form-group">
        <label>Project Description *</label>
        <textarea name="project_description" value={formData.project_description} onChange={handleChange} rows={4} required />
      </div>
      <div className="form-group">
        <label>Location</label>
        <input name="location" value={formData.location} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Budget Range</label>
        <input name="budget_range" value={formData.budget_range} onChange={handleChange} placeholder="e.g. $50,000 - $100,000" />
      </div>
      <div className="form-group">
        <label>Priority</label>
        <select name="priority" value={formData.priority} onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Inquiry'}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default InquiryForm;
