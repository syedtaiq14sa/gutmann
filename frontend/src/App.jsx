import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import TaskQueue from './pages/TaskQueue';
import Reports from './pages/Reports';
import Header from './components/Common/Header';
import Sidebar from './components/Common/Sidebar';
import { checkAuth } from './store/authSlice';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector(state => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <Router>
      {isAuthenticated ? (
        <div className="app-layout">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="app-container">
            <Sidebar userRole={user?.role} isOpen={sidebarOpen} onClose={closeSidebar} />
            {sidebarOpen && (
              <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
            )}
            <main className="main-content">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/tasks" element={<TaskQueue />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
