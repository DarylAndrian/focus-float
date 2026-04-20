import React from 'react';

export default function FatigueBar({ fatigue, threshold, percent }) {
  return (
    <div className="fatigue-section">
      <div className="fatigue-header">
        <span>Fatigue</span>
        <span>{Math.round(fatigue)} / {threshold}</span>
      </div>
      <div className="fatigue-bar">
        <div
          className="fatigue-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
