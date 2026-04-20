import React, { useState } from 'react';

export default function SettingsPanel({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const clean = {
      workDuration: Math.max(1, Math.min(120, form.workDuration)),
      aiDuration: Math.max(1, Math.min(60, form.aiDuration)),
      baseRestDuration: Math.max(1, Math.min(30, form.baseRestDuration)),
      restIncrement: Math.max(0, Math.min(10, form.restIncrement)),
      maxRestDuration: Math.max(5, Math.min(60, form.maxRestDuration)),
      longBreakDuration: Math.max(5, Math.min(60, form.longBreakDuration)),
      fatigueThreshold: Math.max(20, Math.min(200, form.fatigueThreshold)),
      soundEnabled: form.soundEnabled,
      autoStartNext: form.autoStartNext,
    };
    onSave(clean);
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
            <NumInput value={form.workDuration} onChange={v => update('workDuration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="AI Handling Duration">
            <NumInput value={form.aiDuration} onChange={v => update('aiDuration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="Base Rest Duration">
            <NumInput value={form.baseRestDuration} onChange={v => update('baseRestDuration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="Long Break Duration">
            <NumInput value={form.longBreakDuration} onChange={v => update('longBreakDuration', v)} /> <span className="unit">min</span>
          </Row>
        </div>

        <div className="setting-group">
          <h3>🧠 Progressive Rest</h3>
          <Row label="Rest Increment">
            <NumInput value={form.restIncrement} onChange={v => update('restIncrement', v)} /> <span className="unit">min / cycle</span>
          </Row>
          <Row label="Max Rest Duration">
            <NumInput value={form.maxRestDuration} onChange={v => update('maxRestDuration', v)} /> <span className="unit">min</span>
          </Row>
          <Row label="Fatigue Threshold">
            <NumInput value={form.fatigueThreshold} onChange={v => update('fatigueThreshold', v)} /> <span className="unit">pts</span>
          </Row>
        </div>

        <div className="setting-group">
          <h3>🔊 Preferences</h3>
          <Row label="Sound Notifications">
            <Toggle checked={form.soundEnabled} onChange={v => update('soundEnabled', v)} />
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
      onChange={e => onChange(parseInt(e.target.value) || 0)}
      min="1"
    />
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider"></span>
    </label>
  );
}
