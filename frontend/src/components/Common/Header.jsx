import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import { GUTMANN_LOGO_URL } from '../../constants/branding';

function Header({ onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = event => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await dispatch(logout());
    navigate('/login');
  };

  const userLabel = user?.name || user?.email || 'User';
  const avatarInitial = userLabel.trim().charAt(0).toUpperCase();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <span className="hamburger-icon" />
          <span className="hamburger-icon" />
          <span className="hamburger-icon" />
        </button>
        <div className="header-brand">
          <img src={GUTMANN_LOGO_URL} alt="Gutmann logo" className="header-logo" />
          <span className="header-subtitle">Project Workflow</span>
        </div>
      </div>
      <div className="header-actions">
        <div className="notification-bell">
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>
        <div className="profile-menu" ref={userMenuRef}>
          <button
            className="avatar-btn"
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            type="button"
          >
            <span className="avatar-circle">{avatarInitial}</span>
            <span className="avatar-caret">▾</span>
          </button>
          {isUserMenuOpen && (
            <div className="profile-dropdown" role="menu">
              <div className="dropdown-user-info">
                <span className="user-name">{userLabel}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <button type="button" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                Profile
              </button>
              <button type="button" className="dropdown-item danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
