import React from 'react';
import { useSelector } from 'react-redux';
import CEODashboard from '../components/Dashboard/CEODashboard';
import SalesPersonDashboard from '../components/Dashboard/SalesPersonDashboard';
import DepartmentDashboard from '../components/Dashboard/DepartmentDashboard';

function Dashboard() {
  const { user } = useSelector(state => state.auth);

  const renderDashboard = () => {
    switch(user?.role) {
      case 'ceo':
        return <CEODashboard />;
      case 'salesperson':
        return <SalesPersonDashboard />;
      case 'qc':
      case 'technical':
      case 'estimation':
      case 'supply_chain':
        return <DepartmentDashboard />;
      default:
        return <div>Unauthorized</div>;
    }
  };

  return (
    <div className="dashboard-container">
      {renderDashboard()}
    </div>
  );
}

export default Dashboard;
