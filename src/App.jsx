import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import TimerRing from './components/TimerRing';
import FatigueBar from './components/FatigueBar';
import CycleDots from './components/CycleDots';
import StatsRow from './components/StatsRow';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [state, setState] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);

  // Initial state fetch
  useEffect(() => {
    invoke('get_state').then(setState).catch(console.error);
  }, []);

  // Listen for timer ticks from Rust
  useEffect(() => {
    const unlisten = listen('timer-tick', (e) => {
      setState(e.payload);
    });
    return () => unlisten.then((fn) => fn());
  }, []);

  // Phase change notification
  useEffect(() => {
    const unlisten = listen('phase-change', (e) => {
      const s = e.payload;
      const labels = {
        work: '🍅 Time to focus!',
        rest: '☕ Take a break',
        ai: '🤖 AI handling time',
        long_break: '😴 Long break — recharge!',
      };
      invoke('send_notification', {
        title: 'FocusFloat',
        body: labels[s.phase] || 'Phase change',
      });
    });
    return () => unlisten.then((fn) => fn());
  }, []);

  const handleToggle = useCallback(async () => {
    const result = await invoke('toggle_timer');
    setState(result);
  }, []);

  const handleSkip = useCallback(async () => {
    const result = await invoke('skip_phase');
    setState(result);
  }, []);

  const handleReset = useCallback(async () => {
    const result = await invoke('reset_timer');
    setState(result);
  }, []);

  const handleTogglePip = useCallback(async () => {
    const result = await invoke('toggle_pip');
    setPipOpen(result);
  }, []);

  const handleMinimize = useCallback(async () => {
    await getCurrentWindow().minimize();
  }, []);

  if (!state) return <div className="loading">Loading...</div>;

  return (
    <div id="app">
      {/* Title Bar */}
      <div className="title-bar" data-tauri-drag-region>
        <h1>🍅 FocusFloat</h1>
        <div className="controls">
          <button onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
          <button onClick={handleMinimize} title="Minimize">—</button>
        </div>
      </div>

      {/* Phase */}
      <div className="phase-section">
        <div className="phase-label" style={{ color: state.phase_color }}>
          {state.phase_label}
        </div>
        <div className="phase-sublabel">{state.phase_sublabel}</div>
      </div>

      {/* Timer */}
      <TimerRing progress={state.progress} color={state.phase_color}>
        {state.time_display}
      </TimerRing>

      {/* Controls */}
      <div className="controls-section">
        <button className="btn btn-primary" onClick={handleToggle}>
          {state.is_running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="btn btn-secondary" onClick={handleSkip}>⏭ Skip</button>
        <button className="btn btn-pip" onClick={handleTogglePip}>
          {pipOpen ? '🔻 Dock' : '🔲 Float'}
        </button>
      </div>

      {/* Fatigue */}
      <FatigueBar fatigue={state.fatigue} threshold={state.fatigue_threshold} percent={state.fatigue_percent} />

      {/* Stats */}
      <StatsRow state={state} />

      {/* Cycle Dots */}
      <CycleDots cycleOrder={state.cycle_order} currentIndex={state.phase_index} phase={state.phase} />

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSaved={(newState) => setState(newState)}
        />
      )}
    </div>
  );
}
