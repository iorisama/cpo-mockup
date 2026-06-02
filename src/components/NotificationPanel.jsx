import React from 'react';

const NotificationPanel = ({ notifications }) => {
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="notification-panel glass-panel">
      <div className="notification-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        Log Anomali
      </div>
      
      {notifications.length === 0 ? (
        <div className="empty-state">
          Belum ada anomali terdeteksi. Sistem berjalan normal.
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(notif => (
            <div key={notif.id} className={`notification-item ${notif.type}`}>
              <div className="notification-time">
                {formatTime(notif.timestamp)} • {notif.machineName}
              </div>
              <div className="notification-title">{notif.title}</div>
              <div className="notification-desc">{notif.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
