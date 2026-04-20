import React from 'react';

export default function StatsRow({ work, ai, longBreaks, totalHours, totalMins }) {
  const timeStr = totalHours > 0
    ? `${totalHours}h${totalMins > 0 ? totalMins + 'm' : ''}`
    : `${totalMins}m`;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <span className="stat-value">{work}</span>
        <span className="stat-label">🍅 Work</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{ai}</span>
        <span className="stat-label">🤖 AI</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{longBreaks}</span>
        <span className="stat-label">😴 Resets</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{timeStr}</span>
        <span className="stat-label">⏱ Total</span>
      </div>
    </div>
  );
}
