import React, { useState, useEffect, useCallback } from 'react';

export default function SettingsPanel({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings });
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  // Debounce function (300ms)
  const debounce = useCallback((fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }, []);

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
      forcedRestEnabled: form.forcedRestEnabled,
    };
    onSave(clean);
    onClose();
  };

  // Export settings to JSON file
  const handleExport = () => {
    const data = JSON.stringify(form, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focusfloat-settings.json';
    a.click();
    URL.revokeObjectURL(url);

    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 2000);
  };

  // Import settings from JSON file
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        setForm(prev => ({ ...prev, ...imported }));
      } catch (err) {
        console.error('Failed to import settings:', err);
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
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
        <Row label="Forced Rest (Cat)">
          <label className="toggle">
            <input type="checkbox" checked={form.forcedRestEnabled} onChange={e => update('forcedRestEnabled', e.target.checked)} />
            <span className="toggle-track"></span>
          </label>
        </Row>
      </div>

      {/* Export/Import Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className="export-btn"
          onClick={handleExport}
          title="Export settings to file"
          style={{
            flex: 1,
            padding: '12px 16px',
            background: showExportSuccess ? 'var(--c-success)' : 'var(--c-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.target.style.transform = 'translateY(-1px)'}
        >
          <i className="fa-solid fa-download"></i>
          {!showExportSuccess ? 'Export' : 'Exported! ✓'}
        </button>

        <label
          className="import-btn"
          title="Import settings from file"
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--c-bg)',
            color: 'var(--c-text)',
            border: '1px solid var(--c-border)',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--c-border-hover)';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--c-border)';
            e.target.style.transform = 'translateY(0)';
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => {
            e.target.style.borderColor = 'var(--c-border-hover)';
            e.target.style.transform = 'translateY(-1px)';
          }}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <i className="fa-solid fa-upload"></i>
          Import
        </label>
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
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value) || 0;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlurInternal = () => {
    if (localValue === 0) {
      setLocalValue(value);
    }
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--c-border)';
    e.target.style.boxShadow = 'none';
    handleBlurInternal();
  };

  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        min="1"
        aria-label={unit ? `Set ${unit} value` : 'Set value'}
        style={{
          width: '60px',
          padding: '8px 10px',
          background: 'var(--c-bg)',
          border: '1px solid var(--c-border)',
          borderRadius: '6px',
          fontSize: '14px',
          color: 'var(--c-text)',
          textAlign: 'center',
          transition: 'all var(--transition-fast)',
          outline: 'none',
        }}
        onMouseEnter={(e) => e.target.style.borderColor = 'var(--c-border-hover)'}
        onMouseLeave={(e) => e.target.style.borderColor = 'var(--c-border)'}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--c-accent)';
          e.target.style.boxShadow = 'var(--shadow-focus)';
        }}
        onBlur={handleBlur}
      />
      {unit && <span className="setting-unit">{unit}</span>}
    </span>
  );
}
