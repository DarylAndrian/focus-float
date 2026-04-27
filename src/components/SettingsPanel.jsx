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
      visualAlertEnabled: form.visualAlertEnabled,
    };
    onSave(clean);
    onClose();
  };

  return (
    <div className="settings-overlay open">
      <div className="settings-head">
        <h2><i className="fa-solid fa-sliders" style={{ marginRight: 8 }}></i>Settings</h2>
        <button className="icon-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div className="settings-group">
        <h3>Durations</h3>
        <Row label="Work"><NumInput value={form.workDuration} onChange={v => update('workDuration', v)} unit="min" /></Row>
        <Row label="AI Handling"><NumInput value={form.aiDuration} onChange={v => update('aiDuration', v)} unit="min" /></Row>
        <Row label="Base Rest"><NumInput value={form.baseRestDuration} onChange={v => update('baseRestDuration', v)} unit="min" /></Row>
        <Row label="Long Break"><NumInput value={form.longBreakDuration} onChange={v => update('longBreakDuration', v)} unit="min" /></Row>
      </div>

      <div className="settings-group">
        <h3>Progressive Rest</h3>
        <Row label="Rest Increment"><NumInput value={form.restIncrement} onChange={v => update('restIncrement', v)} unit="min / cycle" /></Row>
        <Row label="Max Rest"><NumInput value={form.maxRestDuration} onChange={v => update('maxRestDuration', v)} unit="min" /></Row>
        <Row label="Fatigue Threshold"><NumInput value={form.fatigueThreshold} onChange={v => update('fatigueThreshold', v)} unit="pts" /></Row>
      </div>

      <div className="settings-group">
        <h3>Preferences</h3>
        <Row label="Sound">
          <label className="toggle">
            <input type="checkbox" checked={form.soundEnabled} onChange={e => update('soundEnabled', e.target.checked)} />
            <span className="toggle-track"></span>
          </label>
        </Row>
        <Row label="Visual Alert">
          <label className="toggle">
            <input type="checkbox" checked={form.visualAlertEnabled} onChange={e => update('visualAlertEnabled', e.target.checked)} />
            <span className="toggle-track"></span>
          </label>
        </Row>
      </div>

      <button className="save-btn" onClick={handleSave}>
        <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>Save
      </button>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="setting-item">
      <label>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, unit }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} min="1" />
      {unit && <span className="setting-unit">{unit}</span>}
    </span>
  );
}
