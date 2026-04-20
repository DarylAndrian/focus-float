import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function SettingsPanel({ onClose, onSaved }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    invoke('get_settings').then(setSettings).catch(console.error);
  }, []);

  if (!settings) return null;

  const update = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Validate
    const clean = {
      work_duration: Math.max(1, Math.min(120, settings.work_duration)),
      ai_duration: Math.max(1, Math.min(60, settings.ai_duration)),
      base_rest_duration: Math.max(1, Math.min(30, settings.base_rest_duration)),
      rest_increment: Math.max(0, Math.min(10, settings.rest_increment)),
      max_rest_duration: Math.max(5, Math.min(60, settings.max_rest_duration)),
      long_break_duration: Math.max(5, Math.min(60, settings.long_break_duration)),
      fatigue_threshold: Math.max(20, Math.min(200, settings.fatigue_threshold)),
      sound_enabled: settings.sound_enabled,
      auto_start_next: settings.auto_start_next,
    };

    const newState = await invoke('save_settings', { settings: clean });
    onSaved(newState);
    onClose();
  };

  return (
    <div className="settings-panel open">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <button className="btn btn-secondary" onClick={onClose}>✕ Close</button>
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <h3>⏱ Durations</h3>
          <Row label="Work Duration">
            <NumInput value={settings.work_duration} onChange={(v) => update('work_duration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="AI Handling Duration">
            <NumInput value={settings.ai_duration} onChange={(v) => update('ai_duration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="Base Rest Duration">
            <NumInput value={settings.base_rest_duration} onChange={(v) => update('base_rest_duration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="Long Break Duration">
            <NumInput value={settings.long_break_duration} onChange={(v) => update('long_break_duration', v)} /> <span className="unit">min</span>
          </Row>
        </div>

        <div className="setting-group">
          <h3>🧠 Progressive Rest</h3>
          <Row label="Rest Increment">
            <NumInput value={settings.rest_increment} onChange={(v) => update('rest_increment', v)} /> <span className="unit">min / cycle</span>
          </Row>
          <Row label="Max Rest Duration">
            <NumInput value={settings.max_rest_duration} onChange={(v) => update('max_rest_duration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="Fatigue Threshold">
            <NumInput value={settings.fatigue_threshold} onChange={(v) => update('fatigue_threshold', v)} /> <span className="unit">pts</span>
          </Row>
        </div>

        <div className="setting-group">
          <h3>🔊 Preferences</h3>
          <Row label="Sound Notifications">
            <Toggle checked={settings.sound_enabled} onChange={(v) => update('sound_enabled', v)} />
          </Row>
          <Row label="Auto-start Next Phase">
            <Toggle checked={settings.auto_start_next} onChange={(v) => update('auto_start_next', v)} />
          </Row>
        </div>
      </div>

      <button className="btn btn-primary save-btn" onClick={handleSave}>
        💾 Save & Close
      </button>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="setting-row">
      <label>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function NumInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      min="1"
    />
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider"></span>
    </label>
  );
}
