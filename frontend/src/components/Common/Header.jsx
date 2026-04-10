import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';

function Header({ onToggleSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <span className="hamburger-icon" />
          <span className="hamburger-icon" />
          <span className="hamburger-icon" />
        </button>
        <div className="header-brand">
          <h1>GUTMANN</h1>
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
        <div className="user-info">
          <span className="user-name">{user?.name || user?.email}</span>
          <span className="user-role">{user?.role}</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </header>
  );
}

export default Header;
