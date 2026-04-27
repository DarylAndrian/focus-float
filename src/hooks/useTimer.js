import { useState, useEffect, useRef, useCallback } from 'react';

const PHASES = ['work', 'rest', 'work', 'rest', 'ai', 'rest'];

const PHASE_CONFIG = {
  work: { label: 'Work', icon: 'fa-solid fa-fire', color: '#ef4444', sublabel: 'Deep focus time' },
  rest: { label: 'Rest', icon: 'fa-solid fa-mug-hot', color: '#a3763d', sublabel: 'Recover and recharge' },
  ai: { label: 'AI Handling', icon: 'fa-solid fa-robot', color: '#2dd4bf', sublabel: 'Semi-work: prompts & reviews' },
  long_break: { label: 'Long Break', icon: 'fa-solid fa-moon', color: '#a78bfa', sublabel: 'Full reset — you earned it' },
};

const DEFAULT_SETTINGS = {
  workDuration: 25,
  aiDuration: 20,
  baseRestDuration: 5,
  restIncrement: 2,
  maxRestDuration: 20,
  longBreakDuration: 25,
  fatigueThreshold: 60,
  soundEnabled: true,
  visualAlertEnabled: true,
  autoStartNext: false,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('focusfloat-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettingsToStorage(settings) {
  localStorage.setItem('focusfloat-settings', JSON.stringify(settings));
}

export default function useTimer() {
  const [settings, setSettings] = useState(loadSettings);
  const [phase, setPhase] = useState('work');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [sessions, setSessions] = useState({ work: 0, ai: 0, longBreaks: 0 });
  const [totalWorkMin, setTotalWorkMin] = useState(0);
  const [totalAiMin, setTotalAiMin] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);

  // Derived
  const config = PHASE_CONFIG[phase];
  const phaseDuration = getPhaseDuration(phase, settings, cycleCount);
  const remaining = Math.max(0, phaseDuration - phaseElapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const progress = phaseDuration > 0 ? phaseElapsed / phaseDuration : 0;
  const fatiguePercent = Math.min(100, (fatigue / settings.fatigueThreshold) * 100);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setPhaseElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Phase complete check
  useEffect(() => {
    if (phaseElapsed >= phaseDuration && isRunning) {
      // Stop timer
      setIsRunning(false);

      const completedPhase = phase;

      // Track fatigue
      if (completedPhase === 'work') {
        setFatigue(f => f + settings.workDuration);
        setSessions(s => ({ ...s, work: s.work + 1 }));
        setTotalWorkMin(t => t + settings.workDuration);
      } else if (completedPhase === 'ai') {
        setFatigue(f => f + settings.aiDuration * 0.5);
        setSessions(s => ({ ...s, ai: s.ai + 1 }));
        setTotalAiMin(t => t + settings.aiDuration);
      }

      // Determine next phase
      const currentFatigue = fatigue + (completedPhase === 'work' ? settings.workDuration : completedPhase === 'ai' ? settings.aiDuration * 0.5 : 0);

      // Check for long break
      if (currentFatigue >= settings.fatigueThreshold && completedPhase !== 'long_break') {
        setPhase('long_break');
        setPhaseElapsed(0);
        setSessions(s => ({ ...s, longBreaks: s.longBreaks + 1 }));
        playSound('long_break', settings.soundEnabled);
        notify('Long break — press Start when ready!');
        triggerVisualAlert('long_break', settings.visualAlertEnabled);
        return;
      }

      // After long break, reset
      if (completedPhase === 'long_break') {
        setFatigue(0);
        setCycleCount(0);
        setPhaseIndex(0);
        setPhase('work');
        setPhaseElapsed(0);
        playSound('work', settings.soundEnabled);
        notify('Fresh start — press Start!');
        triggerVisualAlert('work', settings.visualAlertEnabled);
        return;
      }

      // Normal cycle progression
      const nextIndex = (phaseIndex + 1) % PHASES.length;
      const nextPhase = PHASES[nextIndex];

      if (nextIndex === 0) {
        setCycleCount(c => c + 1);
      }

      setPhaseIndex(nextIndex);
      setPhase(nextPhase);
      setPhaseElapsed(0);

      const labels = { work: 'Time to focus!', rest: 'Rest time!', ai: 'AI handling!' };
      playSound(nextPhase, settings.soundEnabled);
      notify(labels[nextPhase] + ' Press Start to begin.');
      triggerVisualAlert(nextPhase, settings.visualAlertEnabled);
    }
  }, [phaseElapsed, phaseDuration, isRunning]);

  const toggle = useCallback(() => setIsRunning(r => !r), []);

  const skip = useCallback(() => {
    setPhaseElapsed(phaseDuration);
  }, [phaseDuration]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('work');
    setPhaseIndex(0);
    setCycleCount(0);
    setFatigue(0);
    setSessions({ work: 0, ai: 0, longBreaks: 0 });
    setTotalWorkMin(0);
    setTotalAiMin(0);
    setPhaseElapsed(0);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  }, []);

  return {
    phase,
    config,
    phaseIndex,
    cycleCount,
    fatigue,
    fatiguePercent,
    sessions,
    totalWorkMin,
    totalAiMin,
    timeDisplay,
    progress,
    isRunning,
    toggle,
    skip,
    reset,
    settings,
    updateSettings,
    cycleOrder: PHASES,
  };
}

// ─── Helpers ───────────────────────────────────────────────────

function getPhaseDuration(phase, settings, cycleCount) {
  switch (phase) {
    case 'work': return settings.workDuration * 60;
    case 'ai': return settings.aiDuration * 60;
    case 'rest': return getProgressiveRest(settings, cycleCount) * 60;
    case 'long_break': return settings.longBreakDuration * 60;
    default: return 25 * 60;
  }
}

function getProgressiveRest(settings, cycleCount) {
  const increment = Math.min(
    cycleCount * settings.restIncrement,
    settings.maxRestDuration - settings.baseRestDuration
  );
  return settings.baseRestDuration + increment;
}

function playSound(phase, enabled) {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    const phaseSounds = {
      work: { freq: 880, duration: 0.8, type: 'square' },
      rest: { freq: 440, duration: 1.0, type: 'sine' },
      ai: { freq: 660, duration: 0.8, type: 'triangle' },
      long_break: { freq: 330, duration: 1.5, type: 'sine' },
    };
    
    const sound = phaseSounds[phase] || phaseSounds.work;
    
    // Create a more noticeable pattern
    const times = [0, 0.2, 0.4];
    times.forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = sound.type;
      osc.frequency.setValueAtTime(sound.freq, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(sound.freq * 1.2, ctx.currentTime + t + 0.1);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + sound.duration / times.length);
      
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + sound.duration / times.length);
    });
  } catch {}
}

function notify(body) {
  if (Notification.permission === 'granted') {
    new Notification('FocusFloat', { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

// ─── Visual Alert (in-app flash) ────────────────────────────

let visualAlertCallback = null;

export function setVisualAlertCallback(cb) {
  visualAlertCallback = cb;
}

function triggerVisualAlert(phase, enabled) {
  if (!enabled) return;
  if (visualAlertCallback) {
    visualAlertCallback(phase);
  }
}
