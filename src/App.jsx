import React, { useState, useEffect } from 'react';
import useTimer, { setVisualAlertCallback } from './hooks/useTimer';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const timer = useTimer();
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('focusfloat-theme') || 'light');
  const [visualAlert, setVisualAlert] = useState(null);

  // Register visual alert callback
  useEffect(() => {
    setVisualAlertCallback((phase) => {
      setVisualAlert(phase);
      setTimeout(() => setVisualAlert(null), 1500);
    });
  }, []);

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

  // Prevent interaction during forced rest (except emergency button)
  useEffect(() => {
    if (timer.forcedRestActive) {
      document.body.style.overflow = 'hidden';
      // Don't disable pointer events globally - handle via overlay
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [timer.forcedRestActive]);

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
        <div className="ring-wrapper">
          <svg className="ring-svg" viewBox="0 0 200 200">
            <circle className="ring-track" cx="100" cy="100" r="90" />
            <circle
              className="ring-fill"
              cx="100" cy="100" r="90"
              style={{
                strokeDashoffset: 565 - (565 * timer.progress),
                stroke: timer.config.color,
              }}
            />
          </svg>
          <div className="phase-time">{timer.timeDisplay}</div>
        </div>
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

      {/* Forced Rest Cat Overlay */}
      {timer.forcedRestActive && (
        <div className="forced-rest-overlay">
          <div className="stickman-fight-container">
            <div className="fight-scene">
              <div className="stickman stickman-1">
                <div className="head"></div>
                <div className="body"></div>
                <div className="arm-left"></div>
                <div className="arm-right"></div>
                <div className="leg-left"></div>
                <div className="leg-right"></div>
              </div>
              <div className="vs-text">🎵</div>
              <div className="stickman stickman-2">
                <div className="head"></div>
                <div className="body"></div>
                <div className="arm-left"></div>
                <div className="arm-right"></div>
                <div className="leg-left"></div>
                <div className="leg-right"></div>
              </div>
            </div>
            <h2>Rest Time! Watch Them Dance! 💃</h2>
            <div className="rest-timer">{timer.timeDisplay}</div>
            <div className="rest-progress">
              <div 
                className="rest-progress-fill" 
                style={{ width: `${timer.progress * 100}%` }}
              ></div>
            </div>
            <p className="rest-hint">Timer running... overlay disappears when rest done.</p>
            <button className="skip-emergency-btn" onClick={timer.skip}>
              🚨 Emergency Skip
            </button>
          </div>
        </div>
      )}

      {/* Visual Alert Flash */}
      {visualAlert && (
        <div className={`visual-alert visual-alert-${visualAlert}`}>
          <i className={timer.config.icon}></i>
          <span>{timer.config.label}</span>
        </div>
      )}
    </div>
  );
}
