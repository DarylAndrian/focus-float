import React from 'react';

const ICONS = { work: '🍅', rest: '☕', ai: '🤖', long_break: '😴' };

export default function CycleDots({ cycleOrder, currentIndex, phase }) {
  if (phase === 'long_break') {
    return (
      <div className="cycle-section">
        <div className="cycle-header">Fatigue Reset</div>
        <div className="cycle-dots">
          <div className="cycle-dot active long-break-dot">😴</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cycle-section">
      <div className="cycle-header">Current Cycle</div>
      <div className="cycle-dots">
        {cycleOrder.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="cycle-arrow">→</span>}
            <div className={`cycle-dot ${p} ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'completed' : ''}`}>
              {ICONS[p] || '?'}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
