// ─── FocusFloat Main Window ────────────────────────────────────

(function () {
  'use strict';

  let timer = null;
  let settings = null;

  // ─── DOM Elements ───────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const phaseLabel = $('phase-label');
  const phaseSublabel = $('phase-sublabel');
  const timerDisplay = $('timer-display');
  const progressRing = $('progress-ring');
  const btnStart = $('btn-start');
  const btnSkip = $('btn-skip');
  const btnPip = $('btn-pip');
  const btnSettingsOpen = $('btn-settings-open');
  const btnSettingsClose = $('btn-settings-close');
  const btnMinimize = $('btn-minimize');
  const settingsPanel = $('settings-panel');
  const fatigueFill = $('fatigue-fill');
  const fatigueText = $('fatigue-text');
  const statWork = $('stat-work');
  const statAi = $('stat-ai');
  const statBreaks = $('stat-breaks');
  const statTime = $('stat-time');
  const cycleDots = $('cycle-dots');

  // Settings inputs
  const setInput = (id) => $(id);

  // ─── Phase Sublabels ────────────────────────────────────────
  const SUBLABELS = {
    work: 'Deep focus time',
    rest: 'Recover and recharge',
    ai: 'Semi-work: prompts & reviews',
    long_break: 'Full reset — you earned it',
  };

  // ─── Init ───────────────────────────────────────────────────
  async function init() {
    // Load settings
    try {
      settings = await window.focusfloat.getSettings();
    } catch {
      settings = getDefaultSettings();
    }

    // Create timer
    timer = new FocusTimer(
      settings,
      onUpdate,       // every second
      onPhaseChange,  // phase transitions
      onComplete      // session done
    );

    // Load settings into UI
    loadSettingsUI();

    // Bind events
    bindEvents();

    // Initial render
    updateCycleDots();
    renderState(timer.getState());
  }

  function getDefaultSettings() {
    return {
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
  }

  // ─── Event Binding ──────────────────────────────────────────
  function bindEvents() {
    btnStart.addEventListener('click', () => {
      timer.toggle();
      syncState();
    });

    btnSkip.addEventListener('click', () => {
      timer.skipPhase();
      syncState();
    });

    btnPip.addEventListener('click', async () => {
      const pipOpen = await window.focusfloat.togglePip();
      btnPip.textContent = pipOpen ? '🔻 Dock' : '🔲 Float';
    });

    btnSettingsOpen.addEventListener('click', () => {
      settingsPanel.classList.add('open');
    });

    btnSettingsClose.addEventListener('click', async () => {
      saveSettingsUI();
      settingsPanel.classList.remove('open');
    });

    btnMinimize.addEventListener('click', () => {
      window.focusfloat.minimizeMain();
    });

    // Listen for settings sync from other window
    window.focusfloat.onSettingsUpdated((newSettings) => {
      settings = newSettings;
      timer.settings = newSettings;
      loadSettingsUI();
      updateCycleDots();
      renderState(timer.getState());
    });

    // Listen for PiP close
    window.focusfloat.onPipClosed(() => {
      btnPip.textContent = '🔲 Float';
    });

    // Sync timer state to PiP
    window.focusfloat.onTimerStateSync((state) => {
      // If PiP sends a play/pause, handle it
      if (state.action === 'toggle') {
        timer.toggle();
        syncState();
      }
    });
  }

  // ─── Timer Callbacks ────────────────────────────────────────
  function onUpdate(state) {
    renderState(state);
    syncState();
  }

  function onPhaseChange(phase, duration) {
    // Phase color update
    const colors = { work: '#e94560', rest: '#0f3460', ai: '#16a085', long_break: '#8e44ad' };
    progressRing.style.stroke = colors[phase] || '#e94560';

    // Sound
    if (settings.soundEnabled) {
      playNotificationSound(phase);
    }

    // Notification
    const labels = {
      work: '🍅 Time to focus!',
      rest: '☕ Take a break',
      ai: '🤖 AI handling time',
      long_break: '😴 Long break — recharge!',
    };
    window.focusfloat.showNotification({
      title: 'FocusFloat',
      body: labels[phase] || 'Phase change',
    });

    updateCycleDots();
  }

  function onComplete() {
    // All done
  }

  // ─── Render ─────────────────────────────────────────────────
  function renderState(state) {
    // Phase
    phaseLabel.textContent = state.phaseLabel;
    phaseLabel.style.color = state.phaseColor;
    phaseSublabel.textContent = SUBLABELS[state.phase] || '';

    // Timer
    timerDisplay.textContent = state.timeDisplay;

    // Progress ring (circumference = 2πr = 2 × π × 100 ≈ 628)
    const circumference = 628;
    const offset = circumference * (1 - state.progress);
    progressRing.style.strokeDashoffset = offset;
    progressRing.style.stroke = state.phaseColor;

    // Button
    btnStart.textContent = state.isRunning ? '⏸ Pause' : '▶ Start';
    btnStart.classList.toggle('running', state.isRunning);

    // Fatigue
    const fatiguePercent = Math.min(100, (state.fatigue / state.fatigueThreshold) * 100);
    fatigueFill.style.width = `${fatiguePercent}%`;
    fatigueText.textContent = `${Math.round(state.fatigue)} / ${state.fatigueThreshold}`;

    // Stats
    const workSessions = state.sessionsCompleted.work;
    const aiSessions = state.sessionsCompleted.ai;
    const totalHours = Math.floor((state.totalWorkMinutes + state.totalAiMinutes) / 60);
    const totalMins = (state.totalWorkMinutes + state.totalAiMinutes) % 60;

    statWork.textContent = workSessions;
    statAi.textContent = aiSessions;
    statBreaks.textContent = state.sessionsCompleted.longBreaks;
    statTime.textContent = totalHours > 0 ? `${totalHours}h${totalMins > 0 ? totalMins + 'm' : ''}` : `${totalMins}m`;
  }

  function renderState(state) {
    phaseLabel.textContent = state.phaseLabel;
    phaseLabel.style.color = state.phaseColor;
    phaseSublabel.textContent = SUBLABELS[state.phase] || '';
    timerDisplay.textContent = state.timeDisplay;

    const circumference = 628;
    const offset = circumference * (1 - state.progress);
    progressRing.style.strokeDashoffset = offset;
    progressRing.style.stroke = state.phaseColor;

    btnStart.textContent = state.isRunning ? '⏸ Pause' : '▶ Start';
    btnStart.classList.toggle('running', state.isRunning);

    const fatiguePercent = Math.min(100, (state.fatigue / state.fatigueThreshold) * 100);
    fatigueFill.style.width = `${fatiguePercent}%`;
    fatigueText.textContent = `${Math.round(state.fatigue)} / ${state.fatigueThreshold}`;

    const workSessions = state.sessionsCompleted.work;
    const aiSessions = state.sessionsCompleted.ai;
    const totalMinutes = state.totalWorkMinutes + state.totalAiMinutes;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;

    statWork.textContent = workSessions;
    statAi.textContent = aiSessions;
    statBreaks.textContent = state.sessionsCompleted.longBreaks;
    statTime.textContent = totalHours > 0
      ? `${totalHours}h${remainingMins > 0 ? remainingMins + 'm' : ''}`
      : `${totalMinutes}m`;
  }

  // ─── Cycle Dots ─────────────────────────────────────────────
  function updateCycleDots() {
    if (!timer) return;
    const order = timer.CYCLE_ORDER;
    const currentIdx = timer.phaseIndex;
    const isLongBreak = timer.phase === 'long_break';

    let html = '';
    const icons = { work: '🍅', rest: '☕', ai: '🤖' };

    order.forEach((phase, i) => {
      if (i > 0) html += '<span class="cycle-arrow">→</span>';

      const isActive = !isLongBreak && i === currentIdx;
      const isCompleted = !isLongBreak && i < currentIdx;

      html += `<div class="cycle-dot ${phase} ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
        ${icons[phase]}
      </div>`;
    });

    if (isLongBreak) {
      html = '<div class="cycle-dot active" style="background:rgba(142,68,173,0.2);border:2px solid #8e44ad;">😴</div>';
    }

    cycleDots.innerHTML = html;
  }

  // ─── Settings ───────────────────────────────────────────────
  function loadSettingsUI() {
    setInput('set-work').value = settings.workDuration;
    setInput('set-ai').value = settings.aiDuration;
    setInput('set-rest').value = settings.baseRestDuration;
    setInput('set-longbreak').value = settings.longBreakDuration;
    setInput('set-increment').value = settings.restIncrement;
    setInput('set-maxrest').value = settings.maxRestDuration;
    setInput('set-fatigue').value = settings.fatigueThreshold;
    setInput('set-sound').checked = settings.soundEnabled;
    setInput('set-autostart').checked = settings.autoStartNext;
  }

  function saveSettingsUI() {
    settings = {
      workDuration: parseInt(setInput('set-work').value) || 25,
      aiDuration: parseInt(setInput('set-ai').value) || 20,
      baseRestDuration: parseInt(setInput('set-rest').value) || 5,
      longBreakDuration: parseInt(setInput('set-longbreak').value) || 25,
      restIncrement: parseInt(setInput('set-increment').value) || 2,
      maxRestDuration: parseInt(setInput('set-maxrest').value) || 20,
      fatigueThreshold: parseInt(setInput('set-fatigue').value) || 60,
      soundEnabled: setInput('set-sound').checked,
      autoStartNext: setInput('set-autostart').checked,
    };

    timer.settings = settings;
    window.focusfloat.saveSettings(settings);
    updateCycleDots();
    renderState(timer.getState());
  }

  // ─── Sound ──────────────────────────────────────────────────
  function playNotificationSound(phase) {
    // Web Audio API beep — no external files needed
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Different tones per phase
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
    } catch (e) {
      // Silent fail — no sound is fine
    }
  }

  // ─── Sync state to PiP ──────────────────────────────────────
  function syncState() {
    if (timer) {
      window.focusfloat.sendTimerState(timer.getState());
    }
  }

  // ─── Boot ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
