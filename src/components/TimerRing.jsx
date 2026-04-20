import React from 'react';

const CIRCUMFERENCE = 2 * Math.PI * 100; // r=100

export default function TimerRing({ progress, color, children }) {
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="timer-ring-wrapper">
      <div className="timer-ring">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle
            className="bg-ring"
            cx="110" cy="110" r="100"
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"
          />
          <circle
            className="progress-ring"
            cx="110" cy="110" r="100"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
            transform="rotate(-90 110 110)"
          />
        </svg>
        <div className="timer-display">{children}</div>
      </div>
    </div>
  );
}
