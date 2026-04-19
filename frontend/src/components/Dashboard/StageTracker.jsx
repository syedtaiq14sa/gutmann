import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function StageTracker({ projects }) {
  const stageData = [
    { stage: 'QC', count: projects.filter(p => p.status === 'qc_review').length },
    { stage: 'Technical', count: projects.filter(p => p.status === 'technical_review').length },
    { stage: 'Estimation', count: projects.filter(p => p.status === 'estimation').length },
    { stage: 'CEO Approval', count: projects.filter(p => p.status === 'ceo_approval').length },
    { stage: 'Sales Follow-up', count: projects.filter(p => p.status === 'sales_followup').length },
    { stage: 'Client Review', count: projects.filter(p => p.status === 'client_review').length },
    { stage: 'Approved', count: projects.filter(p => p.status === 'approved').length },
    { stage: 'Supply Chain', count: projects.filter(p => p.status === 'supply_chain').length }
  ];

  return (
    <div className="stage-tracker">
      <h2>Projects by Stage</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stageData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" name="Projects" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StageTracker;
