import React, { useEffect } from 'react';
import useTimer from './hooks/useTimer';
import TimerRing from './components/TimerRing';
import FatigueBar from './components/FatigueBar';
import CycleDots from './components/CycleDots';
import StatsRow from './components/StatsRow';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const timer = useTimer();
  const [showSettings, setShowSettings] = React.useState(false);

  // Request notification permission on load
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update tab title with countdown
  useEffect(() => {
    document.title = `${timer.timeDisplay} — ${timer.config.label} | FocusFloat`;
  }, [timer.timeDisplay, timer.config.label]);

  const total = timer.totalWorkMin + timer.totalAiMin;
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  return (
    <div id="app">
      {/* Title Bar */}
      <div className="title-bar">
        <h1>🍅 FocusFloat</h1>
        <div className="controls">
          <button onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
        </div>
      </div>

      {/* Phase */}
      <div className="phase-section">
        <div className="phase-label" style={{ color: timer.config.color }}>
          {timer.config.label}
        </div>
        <div className="phase-sublabel">{timer.config.sublabel}</div>
      </div>

      {/* Timer */}
      <TimerRing progress={timer.progress} color={timer.config.color}>
        {timer.timeDisplay}
      </TimerRing>

      {/* Controls */}
      <div className="controls-section">
        <button className="btn btn-primary" onClick={timer.toggle}>
          {timer.isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="btn btn-secondary" onClick={timer.skip}>⏭ Skip</button>
      </div>

      {/* Fatigue */}
      <FatigueBar fatigue={timer.fatigue} threshold={timer.settings.fatigueThreshold} percent={timer.fatiguePercent} />

      {/* Stats */}
      <StatsRow
        work={timer.sessions.work}
        ai={timer.sessions.ai}
        longBreaks={timer.sessions.longBreaks}
        totalHours={hours}
        totalMins={mins}
      />

      {/* Cycle Dots */}
      <CycleDots
        cycleOrder={timer.cycleOrder}
        currentIndex={timer.phaseIndex}
        phase={timer.phase}
      />

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
