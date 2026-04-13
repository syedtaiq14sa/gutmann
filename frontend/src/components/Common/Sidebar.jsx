import React from 'react';
import { NavLink } from 'react-router-dom';
import { GUTMANN_LOGO_URL } from '../../constants/branding';

function Sidebar({ userRole, isOpen, onClose }) {
  const getMenuItems = () => {
    const base = [
      { path: '/dashboard', label: '📊 Dashboard', roles: ['ceo', 'salesperson', 'qc', 'technical', 'estimation', 'supply_chain'] },
      { path: '/tasks', label: '📋 Task Queue', roles: ['qc', 'technical', 'estimation', 'salesperson', 'supply_chain'] },
      { path: '/reports', label: '📈 Reports', roles: ['ceo', 'salesperson'] },
    ];
    return base.filter(item => item.roles.includes(userRole));
  };

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <img src={GUTMANN_LOGO_URL} alt="Gutmann logo" className="sidebar-logo" />
      </div>
      <nav className="sidebar-nav">
        {getMenuItems().map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
