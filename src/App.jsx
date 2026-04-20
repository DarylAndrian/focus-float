import React, { useState, useEffect } from 'react';
import useTimer from './hooks/useTimer';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const timer = useTimer();
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('focusfloat-theme') || 'light');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('focusfloat-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Tab title countdown
  useEffect(() => {
    document.title = `${timer.timeDisplay} — ${timer.config.label} | FocusFloat`;
  }, [timer.timeDisplay, timer.config.label]);

  const total = timer.totalWorkMin + timer.totalAiMin;
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  return (
    <div id="app">
      {/* Top Bar */}
      <div className="top-bar">
        <span className="logo">FocusFloat</span>
        <div className="actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
            <i className="fa-solid fa-sliders"></i>
          </button>
        </div>
      </div>

      {/* Phase */}
      <div className="phase">
        <div className="phase-name">
          <i className={timer.config.icon} style={{ marginRight: 6 }}></i>
          {timer.config.label}
        </div>
        <div className="phase-time">{timer.timeDisplay}</div>
      </div>

      {/* Progress Bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${timer.progress * 100}%` }}></div>
      </div>

      {/* Actions */}
      <div className="actions-main">
        <button className="btn btn-primary" onClick={timer.toggle}>
          {timer.isRunning ? 'Pause' : 'Start'}
        </button>
        <button className="btn btn-secondary" onClick={timer.skip}>
          Skip
        </button>
      </div>

      {/* Fatigue */}
      <div className="fatigue-wrap">
        <div className="section-label">Fatigue</div>
        <div className="fatigue-track">
          <div className="fatigue-fill" style={{ width: `${timer.fatiguePercent}%` }}></div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat">
          <span className="stat-num">{timer.sessions.work}</span>
          <span className="stat-text">Work</span>
        </div>
        <div className="stat">
          <span className="stat-num">{timer.sessions.ai}</span>
          <span className="stat-text">AI</span>
        </div>
        <div className="stat">
          <span className="stat-num">{timer.sessions.longBreaks}</span>
          <span className="stat-text">Resets</span>
        </div>
        <div className="stat">
          <span className="stat-num">{hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`}</span>
          <span className="stat-text">Total</span>
        </div>
      </div>

      {/* Cycle */}
      <div className="cycle-wrap">
        <div className="section-label">Cycle</div>
        <div className="cycle-steps">
          {timer.cycleOrder.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="cycle-arrow"><i className="fa-solid fa-chevron-right"></i></span>}
              <div className={`cycle-step ${p === 'rest' ? 'rest-step' : ''} ${i === timer.phaseIndex && timer.phase !== 'long_break' ? 'active' : ''} ${i < timer.phaseIndex ? 'done' : ''}`}>
                <i className={p === 'work' ? 'fa-solid fa-fire' : p === 'rest' ? 'fa-solid fa-minus' : p === 'ai' ? 'fa-solid fa-robot' : 'fa-solid fa-moon'}></i>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <SettingsPanel
          settings={timer.settings}
          onSave={timer.updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
