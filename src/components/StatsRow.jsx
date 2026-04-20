import React from 'react';

export default function StatsRow({ state }) {
  const total = state.total_work_minutes + state.total_ai_minutes;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const timeStr = hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${total}m`;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <span className="stat-value">{state.sessions_completed.work}</span>
        <span className="stat-label">🍅 Work</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{state.sessions_completed.ai}</span>
        <span className="stat-label">🤖 AI</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{state.sessions_completed.long_breaks}</span>
        <span className="stat-label">😴 Resets</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{timeStr}</span>
        <span className="stat-label">⏱ Total</span>
      </div>
    </div>
  );
}
