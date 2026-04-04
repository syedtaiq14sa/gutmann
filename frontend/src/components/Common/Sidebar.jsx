import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar({ userRole }) {
  const getMenuItems = () => {
    const base = [
      { path: '/dashboard', label: '📊 Dashboard', roles: ['ceo', 'salesperson', 'qc', 'technical', 'estimation'] },
      { path: '/tasks', label: '📋 Task Queue', roles: ['qc', 'technical', 'estimation', 'salesperson'] },
      { path: '/reports', label: '📈 Reports', roles: ['ceo', 'salesperson'] },
    ];
    return base.filter(item => item.roles.includes(userRole));
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {getMenuItems().map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
