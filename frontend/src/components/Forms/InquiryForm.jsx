import React, { useState } from 'react';
import api from '../../services/api';
import gutmannLogo from '../../assets/gutmann-logo.png';
import '../../styles/forms.css';
import '../../styles/inquiry-workflow.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INQUIRY_STEPS = [
  { id: 1, label: 'Client Information', description: 'Enter client details' },
  { id: 2, label: 'Project Details', description: 'Describe the project' },
  { id: 3, label: 'Budget & Timeline', description: 'Set budget and timeline' },
  { id: 4, label: 'Review & Submit', description: 'Review and confirm' }
];

function InquiryForm({ onSuccess, onCancel, mode = 'create', initialData = {} }) {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [completedSteps, setCompletedSteps] = useState([]);

  const handleChange = (e) => {
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = (stepId) => {
    const errors = {};
    if (stepId === 1) {
      if (!formData.client_name.trim()) errors.client_name = 'Client name is required';
      if (!formData.client_email.trim()) {
        errors.client_email = 'Client email is required';
      } else if (!EMAIL_REGEX.test(formData.client_email.trim())) {
        errors.client_email = 'Enter a valid email address';
      }
    } else if (stepId === 2) {
      if (!formData.project_type.trim()) errors.project_type = 'Project type is required';
      if (!formData.project_description.trim()) errors.project_description = 'Project description is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < INQUIRY_STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId) => {
    if (stepId <= currentStep || completedSteps.includes(currentStep)) {
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

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

  const getStepState = (stepId) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="inquiry-workflow-container">
      <aside className="inquiry-sidebar">
        <div className="inquiry-brand-logo">
          <img src={gutmannLogo} alt="Gutmann logo" />
        </div>
        
        <h3>{mode === 'edit' ? 'Edit Query' : 'New Query Intake'}</h3>
        
        <div className="inquiry-steps-list">
          {INQUIRY_STEPS.map((step) => {
            const state = getStepState(step.id);
            const isCompleted = state === 'completed';
            const isActive = state === 'active';
            
            return (
              <button
                key={step.id}
                type="button"
                className={`inquiry-step ${state}${isActive ? ' current' : ''}`}
                onClick={() => handleStepClick(step.id)}
                disabled={step.id > currentStep + 1 && !completedSteps.includes(currentStep)}
              >
                <div className="inquiry-step-marker">
                  {isCompleted ? (
                    <span className="step-checkmark">✓</span>
                  ) : (
                    <span className="step-number">{step.id}</span>
                  )}
                </div>
                <div className="inquiry-step-content">
                  <span className="inquiry-step-label">{step.label}</span>
                  <span className="inquiry-step-hint">{step.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="inquiry-form-panel">
        <form onSubmit={handleSubmit} className="inquiry-form">
          {error && <div className="form-error">{error}</div>}

          {currentStep === 1 && (
            <div className="inquiry-form-step">
              <h2>1. Client Information</h2>
              <p className="step-description">Enter client details to get started</p>
              
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  name="client_name"
                  value={formData.client_name}
                  onChange={handleChange}
                  placeholder="Full name"
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
                  placeholder="Email address"
                  required
                  className={fieldErrors.client_email ? 'input-error' : ''}
                />
                {fieldErrors.client_email && <div className="field-error-text">{fieldErrors.client_email}</div>}
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input 
                  name="client_phone" 
                  value={formData.client_phone} 
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>

              <div className="form-group">
                <label>Company</label>
                <input 
                  name="client_company" 
                  value={formData.client_company} 
                  onChange={handleChange}
                  placeholder="Company name"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="inquiry-form-step">
              <h2>2. Project Details</h2>
              <p className="step-description">Tell us about the project</p>
              
              <div className="form-group">
                <label>Project Type *</label>
                <select
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  required
                  className={fieldErrors.project_type ? 'input-error' : ''}
                >
                  <option value="">Select project type</option>
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
                  placeholder="Describe your project in detail"
                  rows={5}
                  required
                  className={fieldErrors.project_description ? 'input-error' : ''}
                />
                {fieldErrors.project_description && <div className="field-error-text">{fieldErrors.project_description}</div>}
              </div>

              <div className="form-group">
                <label>Location</label>
                <input 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange}
                  placeholder="Project location"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="inquiry-form-step">
              <h2>3. Budget & Timeline</h2>
              <p className="step-description">Specify budget and timeline expectations</p>
              
              <div className="form-group">
                <label>Budget Range</label>
                <input 
                  name="budget_range" 
                  value={formData.budget_range} 
                  onChange={handleChange}
                  placeholder="e.g. $50,000 - $100,000"
                />
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="inquiry-form-step">
              <h2>4. Review & Submit</h2>
              <p className="step-description">Review your information before submitting</p>
              
              <div className="review-summary">
                <div className="review-section">
                  <h4>Client Information</h4>
                  <p><strong>Name:</strong> {formData.client_name}</p>
                  <p><strong>Email:</strong> {formData.client_email}</p>
                  {formData.client_phone && <p><strong>Phone:</strong> {formData.client_phone}</p>}
                  {formData.client_company && <p><strong>Company:</strong> {formData.client_company}</p>}
                </div>
                
                <div className="review-section">
                  <h4>Project Details</h4>
                  <p><strong>Type:</strong> {formData.project_type}</p>
                  <p><strong>Description:</strong> {formData.project_description}</p>
                  {formData.location && <p><strong>Location:</strong> {formData.location}</p>}
                </div>
                
                <div className="review-section">
                  <h4>Budget & Timeline</h4>
                  {formData.budget_range && <p><strong>Budget:</strong> {formData.budget_range}</p>}
                  <p><strong>Priority:</strong> {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="inquiry-form-actions">
            {currentStep > 1 && (
              <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                Previous
              </button>
            )}
            
            {currentStep < INQUIRY_STEPS.length ? (
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleNextStep}
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Submitting...' : (mode === 'edit' ? 'Save Changes' : 'Submit Query')}
              </button>
            )}

            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

export default InquiryForm;
