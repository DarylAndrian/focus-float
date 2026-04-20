import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

export default function PipApp() {
  const [state, setState] = useState(null);

  useEffect(() => {
    invoke('get_state').then(setState).catch(console.error);
  }, []);

  useEffect(() => {
    const unlisten = listen('timer-tick', (e) => {
      setState(e.payload);
    });
    return () => unlisten.then((fn) => fn());
  }, []);

  const handleToggle = async () => {
    const result = await invoke('toggle_timer');
    setState(result);
  };

  const handleExpand = async () => {
    await invoke('focus_main');
  };

  if (!state) return null;

  return (
    <div className="pip-app" data-tauri-drag-region>
      <div className="pip-phase" style={{ color: state.phase_color }}>
        {state.phase_label}
      </div>
      <div className="pip-time">{state.time_display}</div>
      <div className="pip-progress-bar">
        <div
          className="pip-progress-fill"
          style={{
            width: `${state.progress * 100}%`,
            background: state.phase_color,
          }}
        />
      </div>
      <div className="pip-controls">
        <button className="pip-btn pip-btn-play" onClick={handleToggle}>
          {state.is_running ? '⏸' : '▶'}
        </button>
        <button className="pip-btn pip-btn-expand" onClick={handleExpand}>
          ↗
        </button>
      </div>
      <div className="pip-fatigue-mini">
        Fatigue: {Math.round(state.fatigue)}/{state.fatigue_threshold}
      </div>
    </div>
  );
}
