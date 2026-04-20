import { useState, useEffect, useRef, useCallback } from 'react';

const PHASES = ['work', 'rest', 'work', 'rest', 'ai', 'rest'];

const PHASE_CONFIG = {
  work: { label: '🍅 Work', color: '#e94560', sublabel: 'Deep focus time' },
  rest: { label: '☕ Rest', color: '#0f3460', sublabel: 'Recover and recharge' },
  ai: { label: '🤖 AI Handling', color: '#16a085', sublabel: 'Semi-work: prompts & reviews' },
  long_break: { label: '😴 Long Break', color: '#8e44ad', sublabel: 'Full reset — you earned it' },
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

function saveSettings(settings) {
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

  const progressiveRest = getProgressiveRest(settings, cycleCount);

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
      completePhase();
    }
  }, [phaseElapsed, phaseDuration, isRunning]);

  function completePhase() {
    const completedPhase = phase;
    let newFatigue = fatigue;
    let newSessions = { ...sessions };
    let newTotalWork = totalWorkMin;
    let newTotalAi = totalAiMin;

    // Track fatigue
    if (completedPhase === 'work') {
      newFatigue = fatigue + settings.workDuration;
      newSessions.work += 1;
      newTotalWork += settings.workDuration;
    } else if (completedPhase === 'ai') {
      newFatigue = fatigue + settings.aiDuration * 0.5;
      newSessions.ai += 1;
      newTotalAi += settings.aiDuration;
    }

    setFatigue(newFatigue);
    setSessions(newSessions);
    setTotalWorkMin(newTotalWork);
    setTotalAiMin(newTotalAi);

    // Check for long break
    if (newFatigue >= settings.fatigueThreshold && completedPhase !== 'long_break') {
      setPhase('long_break');
      setPhaseElapsed(0);
      newSessions.longBreaks += 1;
      setSessions(newSessions);
      playSound('long_break');
      notify('😴 Long break — recharge!');
      return;
    }

    // After long break, reset
    if (completedPhase === 'long_break') {
      setFatigue(0);
      setCycleCount(0);
      setPhaseIndex(0);
      setPhase('work');
      setPhaseElapsed(0);
      playSound('work');
      notify('🍅 Time to focus!');
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

    playSound(nextPhase);
    notify(PHASE_CONFIG[nextPhase].label + '!');
  }

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
    saveSettings(newSettings);
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
    progressiveRest,
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

function playSound(phase) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const tones = {
      work: [660, 880],
      rest: [440, 550],
      ai: [520, 660],
      long_break: [330, 440],
    };
    const [f1, f2] = tones[phase] || [660, 880];

    osc.frequency.setValueAtTime(f1, ctx.currentTime);
    osc.frequency.setValueAtTime(f2, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(f1, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

function notify(body) {
  if (Notification.permission === 'granted') {
    new Notification('FocusFloat', { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
