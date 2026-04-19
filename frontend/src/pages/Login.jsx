import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/authSlice';
import '../styles/forms.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(state => state.auth);

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email or username is required.';
    if (!password.trim()) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetInfo('');
    if (!validate()) return;

    try {
      await dispatch(login({ email: email.trim(), password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-shell">
      <div className="login-brand-panel">
        <div className="brand-content">
          <p className="brand-kicker">Gutmann Aluminum</p>
          <h1>Welcome to Gutmann Systems</h1>
          <p className="brand-subtext">
            Access your dashboard to manage sales inquiries, projects, and technical workflows.
          </p>
          <div className="brand-pattern" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="brand-contact">
            <div className="brand-contact-item">
              <span className="brand-icon" aria-hidden="true">✉</span>
              <a href="mailto:info@gutmann.com">info@gutmann.com</a>
            </div>
            <div className="brand-contact-item">
              <span className="brand-icon" aria-hidden="true">☎</span>
              <a href="tel:+971000000000">+971 00 000 0000</a>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-box">
          <div className="login-logo">
            <h2>Sign in to your account</h2>
          </div>
          {error && <div className="error-message">{error}</div>}
          {resetInfo && <div className="success-message">{resetInfo}</div>}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email">Email / Username</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                autoComplete="username"
                placeholder="Enter your email or username"
                className={fieldErrors.email ? 'input-error' : ''}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email && <div id="email-error" className="field-error-text">{fieldErrors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="Enter your password"
                  className={fieldErrors.password ? 'input-error' : ''}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <div id="password-error" className="field-error-text">{fieldErrors.password}</div>}
            </div>

            <div className="login-options-row">
              <label className="remember-checkbox" htmlFor="rememberMe">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
              <button
                type="button"
                className="forgot-link forgot-button"
                onClick={() => setResetInfo('Please contact info@gutmann.com to request a password reset.')}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn-primary login-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
