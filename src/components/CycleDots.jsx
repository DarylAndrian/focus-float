import React from 'react';

const ICONS = {
  work: 'fa-solid fa-fire',
  rest: 'fa-solid fa-mug-hot',
  ai: 'fa-solid fa-robot',
  long_break: 'fa-solid fa-moon',
};

export default function CycleDots({ cycleOrder, currentIndex, phase }) {
  if (phase === 'long_break') {
    return (
      <div className="cycle-section">
        <div className="cycle-header">Fatigue Reset</div>
        <div className="cycle-dots">
          <div className="cycle-dot active long-break-dot">
            <i className="fa-solid fa-moon"></i>
          </div>
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
            {i > 0 && <span className="cycle-arrow"><i className="fa-solid fa-chevron-right"></i></span>}
            <div className={`cycle-dot ${p} ${i === currentIndex ? 'active' : ''} ${i < currentIndex ? 'completed' : ''}`}>
              <i className={ICONS[p]}></i>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
