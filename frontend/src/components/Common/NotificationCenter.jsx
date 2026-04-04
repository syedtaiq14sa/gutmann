import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotifications, markNotificationRead } from '../../store/notificationSlice';

function NotificationCenter() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(state => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="unread-count">{unreadCount} unread</span>}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => !notif.read && handleMarkRead(notif.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  {!notif.read && <span className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type) {
  const icons = {
    review_required: '📋',
    approval_required: '⏳',
    approved: '✅',
    rejected: '❌',
    bottleneck: '⚠️',
    quotation_ready: '💰',
    stage_changed: '🔄',
    default: '🔔'
  };
  return icons[type] || icons.default;
}

export default NotificationCenter;
