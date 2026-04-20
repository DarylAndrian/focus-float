import React, { useState, useEffect, useRef } from 'react';
import useTimer from './hooks/useTimer';
import TimerRing from './components/TimerRing';
import FatigueBar from './components/FatigueBar';
import CycleDots from './components/CycleDots';
import StatsRow from './components/StatsRow';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const timer = useTimer();
  const [showSettings, setShowSettings] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const pipDocRef = useRef(null);

  // Request notification permission on load
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // PiP via Document Picture-in-Picture API
  const togglePip = async () => {
    if (pipDocRef.current) {
      // Close existing PiP
      try { await pipDocRef.current.close(); } catch {}
      pipDocRef.current = null;
      setPipActive(false);
      return;
    }

    if (!('documentPictureInPicture' in window)) {
      alert('Your browser does not support Document PiP. Try Chrome or Edge.');
      return;
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 220,
        height: 200,
      });
      pipDocRef.current = pipWindow;

      // Copy styles
      const style = document.createElement('style');
      style.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: rgba(26, 26, 46, 0.92);
          backdrop-filter: blur(20px);
          color: #eaeaea;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
          user-select: none;
        }
        .pip-phase { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
        .pip-time { font-size: 34px; font-weight: 200; font-variant-numeric: tabular-nums; letter-spacing: 2px; margin-bottom: 8px; }
        .pip-bar { width: 120px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-bottom: 10px; }
        .pip-fill { height: 100%; border-radius: 2px; transition: width 1s linear; }
        .pip-controls { display: flex; gap: 10px; }
        .pip-btn { width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; font-size: 14px; }
        .pip-btn-play { background: #e94560; color: white; }
        .pip-fatigue { font-size: 10px; color: #a0a0b0; margin-top: 6px; }
      `;
      pipWindow.document.head.appendChild(style);

      // Handle close
      pipWindow.addEventListener('pagehide', () => {
        pipDocRef.current = null;
        setPipActive(false);
      });

      setPipActive(true);
    } catch (e) {
      console.error('PiP failed:', e);
    }
  };

  // Update PiP content
  useEffect(() => {
    if (!pipDocRef.current) return;
    const doc = pipDocRef.current.document;
    doc.body.innerHTML = `
      <div class="pip-phase" style="color: ${timer.config.color}">${timer.config.label}</div>
      <div class="pip-time">${timer.timeDisplay}</div>
      <div class="pip-bar">
        <div class="pip-fill" style="width: ${timer.progress * 100}%; background: ${timer.config.color}"></div>
      </div>
      <div class="pip-controls">
        <button class="pip-btn pip-btn-play" onclick="window.__pipToggle()">
          ${timer.isRunning ? '⏸' : '▶'}
        </button>
      </div>
      <div class="pip-fatigue">Fatigue: ${Math.round(timer.fatigue)}/${timer.settings.fatigueThreshold}</div>
    `;
  }, [timer.timeDisplay, timer.progress, timer.isRunning, timer.config, timer.fatigue, timer.settings.fatigueThreshold, pipActive]);

  // Expose toggle to PiP button
  useEffect(() => {
    window.__pipToggle = timer.toggle;
  }, [timer.toggle]);

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
        <button className="btn btn-pip" onClick={togglePip}>
          {pipActive ? '🔻 Dock' : '🔲 Float'}
        </button>
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
