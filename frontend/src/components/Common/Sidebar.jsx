import React from 'react';
import { NavLink } from 'react-router-dom';
import { GUTMANN_LOGO_URL } from '../../constants/branding';

const BUSINESS_MODULES = [
  { id: 'crm', label: '👥 CRM', description: 'Customer Relationship Management' },
  { id: 'hr', label: '👤 HR', description: 'Human Resources' },
  { id: 'finance', label: '💰 Finance', description: 'Financial Management' },
  { id: 'supply-chain', label: '📦 Supply Chain', description: 'Supply Chain Operations' },
  { id: 'admin', label: '⚙️ Admin', description: 'System Administration' },
  { id: 'analytics', label: '📊 Analytics', description: 'Business Intelligence' },
];

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
      
      <div className="sidebar-modules-section">
        <h4 className="modules-heading">📈 Scalable Modules</h4>
        <p className="modules-subtitle">Future capabilities to expand your operations</p>
        <div className="modules-grid">
          {BUSINESS_MODULES.map(module => (
            <div key={module.id} className="module-card" title={module.description}>
              <span className="module-icon">{module.label.split(' ')[0]}</span>
              <span className="module-name">{module.label.split(' ').slice(1).join(' ')}</span>
              <span className="coming-soon-badge">Coming Soon</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
