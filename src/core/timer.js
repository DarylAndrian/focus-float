// ─── Timer Core Engine ──────────────────────────────────────────
// Shared logic for the Enhanced Pomodoro timer

const PHASES = {
  WORK: 'work',
  REST: 'rest',
  AI: 'ai',
  LONG_BREAK: 'long_break',
};

const PHASE_LABELS = {
  [PHASES.WORK]: '🍅 Work',
  [PHASES.REST]: '☕ Rest',
  [PHASES.AI]: '🤖 AI Handling',
  [PHASES.LONG_BREAK]: '😴 Long Break',
};

const PHASE_COLORS = {
  [PHASES.WORK]: '#e94560',     // red
  [PHASES.REST]: '#0f3460',     // blue
  [PHASES.AI]: '#16a085',       // teal
  [PHASES.LONG_BREAK]: '#8e44ad', // purple
};

class FocusTimer {
  constructor(settings, onUpdate, onPhaseChange, onComplete) {
    this.settings = settings;
    this.onUpdate = onUpdate;       // called every second
    this.onPhaseChange = onPhaseChange; // called when phase changes
    this.onComplete = onComplete;   // called when session is fully done

    this.reset();
  }

  reset() {
    this.phase = PHASES.WORK;
    this.phaseIndex = 0;           // position in cycle
    this.cycleCount = 0;           // full cycles completed
    this.totalWorkMinutes = 0;     // cumulative deep work
    this.totalAiMinutes = 0;       // cumulative AI work
    this.fatigue = 0;              // fatigue accumulator
    this.sessionsCompleted = {
      work: 0,
      ai: 0,
      longBreaks: 0,
    };

    this.totalElapsed = 0;
    this.phaseDuration = this.getPhaseDuration(PHASES.WORK);
    this.phaseElapsed = 0;
    this.isRunning = false;
    this.intervalId = null;

    this.updateUI();
  }

  // ─── Phase Cycle ───────────────────────────────────────────
  // Cycle order: [Work, Rest, Work, Rest, AI, Rest] → repeat
  // After fatigue threshold → Long Break → reset fatigue
  // Phase indices:
  //   0 = Work, 1 = Rest, 2 = Work, 3 = Rest, 4 = AI, 5 = Rest
  //   then back to 0

  CYCLE_ORDER = [PHASES.WORK, PHASES.REST, PHASES.WORK, PHASES.REST, PHASES.AI, PHASES.REST];

  getPhaseDuration(phase) {
    switch (phase) {
      case PHASES.WORK:
        return this.settings.workDuration * 60;
      case PHASES.AI:
        return this.settings.aiDuration * 60;
      case PHASES.REST:
        return this.getProgressiveRest() * 60;
      case PHASES.LONG_BREAK:
        return this.settings.longBreakDuration * 60;
      default:
        return 25 * 60;
    }
  }

  getProgressiveRest() {
    // Base rest + increment based on cycles completed
    const increment = Math.min(
      this.cycleCount * this.settings.restIncrement,
      this.settings.maxRestDuration - this.settings.baseRestDuration
    );
    return this.settings.baseRestDuration + increment;
  }

  shouldLongBreak() {
    return this.fatigue >= this.settings.fatigueThreshold;
  }

  // ─── Start / Pause / Resume ────────────────────────────────
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.updateUI();
  }

  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateUI();
  }

  toggle() {
    if (this.isRunning) this.pause();
    else this.start();
  }

  // ─── Tick ──────────────────────────────────────────────────
  tick() {
    if (!this.isRunning) return;

    this.phaseElapsed++;
    this.totalElapsed++;

    // Check if phase is complete
    if (this.phaseElapsed >= this.phaseDuration) {
      this.completePhase();
    }

    this.updateUI();
  }

  // ─── Phase Completion ──────────────────────────────────────
  completePhase() {
    const completedPhase = this.phase;

    // Track fatigue for work phases
    if (completedPhase === PHASES.WORK) {
      this.fatigue += this.settings.workDuration;
      this.sessionsCompleted.work++;
      this.totalWorkMinutes += this.settings.workDuration;
    } else if (completedPhase === PHASES.AI) {
      // AI counts as half fatigue
      this.fatigue += this.settings.aiDuration * 0.5;
      this.sessionsCompleted.ai++;
      this.totalAiMinutes += this.settings.aiDuration;
    }

    // Check for long break
    if (this.shouldLongBreak() && completedPhase !== PHASES.LONG_BREAK) {
      this.phase = PHASES.LONG_BREAK;
      this.phaseDuration = this.getPhaseDuration(PHASES.LONG_BREAK);
      this.phaseElapsed = 0;
      this.sessionsCompleted.longBreaks++;
      this.onPhaseChange(this.phase, this.phaseDuration);
      this.sendState();
      return;
    }

    // After long break, reset fatigue and continue cycle
    if (completedPhase === PHASES.LONG_BREAK) {
      this.fatigue = 0;
      this.cycleCount = 0;
      this.phaseIndex = 0;
      this.phase = PHASES.WORK;
      this.phaseDuration = this.getPhaseDuration(PHASES.WORK);
      this.phaseElapsed = 0;
      this.onPhaseChange(this.phase, this.phaseDuration);
      this.sendState();
      return;
    }

    // Normal cycle progression
    this.phaseIndex++;
    if (this.phaseIndex >= this.CYCLE_ORDER.length) {
      this.phaseIndex = 0;
      this.cycleCount++;
    }

    this.phase = this.CYCLE_ORDER[this.phaseIndex];
    this.phaseDuration = this.getPhaseDuration(this.phase);
    this.phaseElapsed = 0;

    this.onPhaseChange(this.phase, this.phaseDuration);
    this.sendState();
  }

  // ─── Time Formatting ───────────────────────────────────────
  getFormattedTime() {
    const remaining = Math.max(0, this.phaseDuration - this.phaseElapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getProgress() {
    if (this.phaseDuration === 0) return 0;
    return this.phaseElapsed / this.phaseDuration;
  }

  // ─── State for UI / Sync ───────────────────────────────────
  getState() {
    return {
      phase: this.phase,
      phaseLabel: PHASE_LABELS[this.phase],
      phaseColor: PHASE_COLORS[this.phase],
      timeDisplay: this.getFormattedTime(),
      progress: this.getProgress(),
      isRunning: this.isRunning,
      phaseElapsed: this.phaseElapsed,
      phaseDuration: this.phaseDuration,
      fatigue: this.fatigue,
      fatigueThreshold: this.settings.fatigueThreshold,
      cycleCount: this.cycleCount,
      sessionsCompleted: this.sessionsCompleted,
      totalWorkMinutes: this.totalWorkMinutes,
      totalAiMinutes: this.totalAiMinutes,
      totalElapsed: this.totalElapsed,
      progressiveRest: this.getProgressiveRest(),
    };
  }

  // ─── Callbacks ─────────────────────────────────────────────
  updateUI() {
    if (this.onUpdate) this.onUpdate(this.getState());
  }

  sendState() {
    // For IPC sync if needed
    if (this.onUpdate) this.onUpdate(this.getState());
  }

  // ─── Skip to next phase (for testing / manual advance) ─────
  skipPhase() {
    this.phaseElapsed = this.phaseDuration;
    this.completePhase();
  }

  // ─── Load state from sync ──────────────────────────────────
  loadState(state) {
    if (state) {
      this.phase = state.phase;
      this.phaseIndex = state.phaseIndex || 0;
      this.cycleCount = state.cycleCount || 0;
      this.fatigue = state.fatigue || 0;
      this.sessionsCompleted = state.sessionsCompleted || { work: 0, ai: 0, longBreaks: 0 };
      this.totalWorkMinutes = state.totalWorkMinutes || 0;
      this.totalAiMinutes = state.totalAiMinutes || 0;
      this.totalElapsed = state.totalElapsed || 0;
      this.phaseDuration = this.getPhaseDuration(this.phase);
      this.updateUI();
    }
  }
}

// Export for both Node.js (preload) and browser contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FocusTimer, PHASES, PHASE_LABELS, PHASE_COLORS };
}
