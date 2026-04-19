import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function TaskQueue() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/dashboard/tasks');
        setTasks(response.data || []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return (task.visibility_group || 'active') === filter;
  });

  if (loading) return <div className="loading-spinner">Loading tasks...</div>;

  return (
    <div className="task-queue">
      <div className="page-header">
        <h1>Task Queue</h1>
        <div className="filter-buttons">
          {['active', 'completed', 'returned', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn-filter ${filter === f ? 'active' : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">No tasks in queue</div>
      ) : (
        <div className="task-list">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`task-card priority-${task.priority}`}
              onClick={() => navigate(`/projects/${task.project_id}`)}
            >
              <div className="task-header">
                <span className="task-title">{task.title || task.inquiry_number}</span>
                <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
              </div>
              <div className="task-meta">
                <span>Stage: {task.stage?.replace('_', ' ')}</span>
                <span>View: {(task.visibility_group || 'active').replace('_', ' ')}</span>
                <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}</span>
              </div>
              {task.bottleneck_flag && (
                <div className="bottleneck-alert">⚠️ Bottleneck Detected</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskQueue;
