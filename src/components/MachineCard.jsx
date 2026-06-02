import React from 'react';

const MachineCard = ({ machine, isSelected, onClick }) => {
  return (
    <div 
      className={`machine-card glass-panel ${isSelected ? 'selected' : ''}`} 
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="machine-header">
        <div className="machine-name">{machine.name}</div>
        <div className="status-indicator">
          <div className={`status-dot ${machine.status}`}></div>
          <span style={{ textTransform: 'capitalize' }}>{machine.status}</span>
        </div>
      </div>
      
      <div className="metrics-grid">
        <div className="metric-item">
          <span className="metric-label">Suhu</span>
          <div className="metric-value">
            {machine.temp.toFixed(1)} <span className="metric-unit">°C</span>
          </div>
        </div>
        
        <div className="metric-item">
          <span className="metric-label">Kelembapan</span>
          <div className="metric-value">
            {machine.humidity.toFixed(1)} <span className="metric-unit">%</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">Tegangan</span>
          <div className="metric-value">
            {machine.voltage.toFixed(1)} <span className="metric-unit">V</span>
          </div>
        </div>

        <div className="metric-item">
          <span className="metric-label">Arus</span>
          <div className="metric-value">
            {machine.current.toFixed(1)} <span className="metric-unit">A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineCard;
