import React from 'react';

const STATUS_CONFIG = {
  received: { label: 'Received', color: '#6c757d', bg: '#f8f9fa' },
  qc_review: { label: 'QC Review', color: '#0d6efd', bg: '#cfe2ff' },
  qc_revision: { label: 'QC Revision', color: '#fd7e14', bg: '#ffe5d0' },
  technical_review: { label: 'Technical Review', color: '#0dcaf0', bg: '#cff4fc' },
  technical_revision: { label: 'Technical Revision', color: '#fd7e14', bg: '#ffe5d0' },
  estimation: { label: 'Estimation', color: '#6610f2', bg: '#e0cffc' },
  ceo_approval: { label: 'CEO Approval', color: '#dc3545', bg: '#f8d7da' },
  client_review: { label: 'Client Review', color: '#20c997', bg: '#d1ecf1' },
  approved: { label: 'Approved', color: '#198754', bg: '#d1e7dd' },
  rejected: { label: 'Rejected', color: '#dc3545', bg: '#f8d7da' }
};

function StatusBadge({ status, size = 'normal' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: '#6c757d', bg: '#f8f9fa' };

  const style = {
    display: 'inline-block',
    padding: size === 'small' ? '2px 8px' : '4px 12px',
    borderRadius: '20px',
    fontSize: size === 'small' ? '11px' : '13px',
    fontWeight: '600',
    color: config.color,
    backgroundColor: config.bg,
    border: `1px solid ${config.color}30`,
    whiteSpace: 'nowrap'
  };

  return <span style={style}>{config.label}</span>;
}

export default StatusBadge;
