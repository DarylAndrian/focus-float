// ─── FocusFloat PiP Window ─────────────────────────────────────

(function () {
  'use strict';

  let timer = null;
  let settings = null;

  // ─── DOM Elements ───────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const pipApp = $('pip-app');
  const pipPhase = $('pip-phase');
  const pipTime = $('pip-time');
  const pipProgress = $('pip-progress');
  const pipBtnPlay = $('pip-btn-play');
  const pipBtnExpand = $('pip-btn-expand');
  const pipFatigue = $('pip-fatigue');

  // ─── Drag State ─────────────────────────────────────────────
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  // ─── Init ───────────────────────────────────────────────────
  async function init() {
    try {
      settings = await window.focusfloat.getSettings();
    } catch {
      settings = {
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

    // Create timer for PiP (independent but synced)
    timer = new FocusTimer(
      settings,
      onUpdate,
      onPhaseChange,
      onComplete
    );

    // Bind events
    bindEvents();

    // Setup drag
    setupDrag();

    // Listen for state sync from main window
    window.focusfloat.onTimerStateSync((state) => {
      if (state && state.phase) {
        renderState(state);
      }
    });

    // Listen for settings updates
    window.focusfloat.onSettingsUpdated((newSettings) => {
      settings = newSettings;
      timer.settings = newSettings;
      renderState(timer.getState());
    });

    // Render initial
    renderState(timer.getState());
  }

  // ─── Events ─────────────────────────────────────────────────
  function bindEvents() {
    pipBtnPlay.addEventListener('click', () => {
      timer.toggle();
      // Sync to main window
      window.focusfloat.sendTimerState({ action: 'toggle', ...timer.getState() });
      renderState(timer.getState());
    });

    pipBtnExpand.addEventListener('click', () => {
      window.focusfloat.closePip();
    });
  }

  // ─── Drag ───────────────────────────────────────────────────
  function setupDrag() {
    pipApp.addEventListener('mousedown', (e) => {
      if (e.target.closest('.pip-btn')) return;
      isDragging = true;
      dragOffset.x = e.clientX;
      dragOffset.y = e.clientY;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragOffset.x;
      const dy = e.clientY - dragOffset.y;
      const currentX = window.screenX || 0;
      const currentY = window.screenY || 0;
      window.moveBy?.(dx, dy);
      dragOffset.x = e.clientX;
      dragOffset.y = e.clientY;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  // ─── Callbacks ──────────────────────────────────────────────
  function onUpdate(state) {
    renderState(state);
  }

  function onPhaseChange(phase, duration) {
    // Flash the window briefly
    document.body.style.opacity = '0.7';
    setTimeout(() => { document.body.style.opacity = '1'; }, 200);
    setTimeout(() => { document.body.style.opacity = '0.8'; }, 400);
    setTimeout(() => { document.body.style.opacity = '1'; }, 600);
  }

  function onComplete() {}

  // ─── Render ─────────────────────────────────────────────────
  function renderState(state) {
    pipPhase.textContent = state.phaseLabel;
    pipPhase.style.color = state.phaseColor;
    pipTime.textContent = state.timeDisplay;
    pipProgress.style.width = `${state.progress * 100}%`;
    pipProgress.style.background = state.phaseColor;
    pipBtnPlay.textContent = state.isRunning ? '⏸' : '▶';
    pipFatigue.textContent = `Fatigue: ${Math.round(state.fatigue)}/${state.fatigueThreshold}`;
  }

  // ─── Boot ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);
})();
