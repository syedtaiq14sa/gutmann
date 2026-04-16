import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles/forms.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function InquiryForm({ onSuccess, onCancel, mode = 'create', initialData = {} }) {
  const [formData, setFormData] = useState({
    client_name: initialData.client_name || '',
    client_email: initialData.client_email || '',
    client_phone: initialData.client_phone || '',
    client_company: initialData.client_company || '',
    project_type: initialData.project_type || '',
    project_description: initialData.project_description || '',
    location: initialData.location || '',
    budget_range: initialData.budget_range || '',
    priority: initialData.priority || 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errors = {};
    if (!formData.client_name.trim()) errors.client_name = 'Client name is required';
    if (!formData.client_email.trim()) {
      errors.client_email = 'Client email is required';
    } else if (!EMAIL_REGEX.test(formData.client_email.trim())) {
      errors.client_email = 'Enter a valid email address';
    }
    if (!formData.project_type.trim()) errors.project_type = 'Project type is required';
    if (!formData.project_description.trim()) errors.project_description = 'Project description is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        client_name: formData.client_name.trim(),
        client_email: formData.client_email.trim(),
        client_phone: formData.client_phone.trim(),
        client_company: formData.client_company.trim(),
        project_type: formData.project_type.trim(),
        project_description: formData.project_description.trim(),
        location: formData.location.trim(),
        budget_range: formData.budget_range.trim()
      };
      const response = mode === 'edit'
        ? await api.put(`/inquiries/${initialData.id}`, payload)
        : await api.post('/inquiries', payload);
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      if (Array.isArray(err.response?.data?.errors)) {
        const mapped = {};
        err.response.data.errors.forEach((item) => {
          if (item?.path && !mapped[item.path]) mapped[item.path] = item.msg;
        });
        setFieldErrors(prev => ({ ...prev, ...mapped }));
        setError('Please fix the highlighted form fields');
      } else {
        setError(err.response?.data?.error || 'Failed to submit inquiry');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="gutmann-form" onSubmit={handleSubmit}>
      <h2>{mode === 'edit' ? 'Edit Query' : 'New Query'}</h2>
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label>Client Name *</label>
        <input
          name="client_name"
          value={formData.client_name}
          onChange={handleChange}
          required
          className={fieldErrors.client_name ? 'input-error' : ''}
        />
        {fieldErrors.client_name && <div className="field-error-text">{fieldErrors.client_name}</div>}
      </div>
      <div className="form-group">
        <label>Client Email *</label>
        <input
          type="email"
          name="client_email"
          value={formData.client_email}
          onChange={handleChange}
          required
          className={fieldErrors.client_email ? 'input-error' : ''}
        />
        {fieldErrors.client_email && <div className="field-error-text">{fieldErrors.client_email}</div>}
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
        <select
          name="project_type"
          value={formData.project_type}
          onChange={handleChange}
          required
          className={fieldErrors.project_type ? 'input-error' : ''}
        >
          <option value="">Select type</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="industrial">Industrial</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="other">Other</option>
        </select>
        {fieldErrors.project_type && <div className="field-error-text">{fieldErrors.project_type}</div>}
      </div>
      <div className="form-group">
        <label>Project Description *</label>
        <textarea
          name="project_description"
          value={formData.project_description}
          onChange={handleChange}
          rows={4}
          required
          className={fieldErrors.project_description ? 'input-error' : ''}
        />
        {fieldErrors.project_description && <div className="field-error-text">{fieldErrors.project_description}</div>}
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
          {loading ? (mode === 'edit' ? 'Saving...' : 'Submitting...') : (mode === 'edit' ? 'Save Changes' : 'Create Query')}
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
