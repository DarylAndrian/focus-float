// ─── FocusFloat Backend (Rust + Tauri) ─────────────────────────
// Timer engine, window management, system tray, IPC

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    image::Image, Manager, PhysicalSize, State, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, WebviewWindowBuilder, WebviewWindow, WindowEvent,
};
use tokio::time::{interval, Duration};

// ─── Timer Engine ──────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Phase {
    Work,
    Rest,
    Ai,
    LongBreak,
}

impl Phase {
    fn label(&self) -> &str {
        match self {
            Phase::Work => "🍅 Work",
            Phase::Rest => "☕ Rest",
            Phase::Ai => "🤖 AI Handling",
            Phase::LongBreak => "😴 Long Break",
        }
    }

    fn color(&self) -> &str {
        match self {
            Phase::Work => "#e94560",
            Phase::Rest => "#0f3460",
            Phase::Ai => "#16a085",
            Phase::LongBreak => "#8e44ad",
        }
    }

    fn sublabel(&self) -> &str {
        match self {
            Phase::Work => "Deep focus time",
            Phase::Rest => "Recover and recharge",
            Phase::Ai => "Semi-work: prompts & reviews",
            Phase::LongBreak => "Full reset — you earned it",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub work_duration: u32,      // minutes
    pub ai_duration: u32,        // minutes
    pub base_rest_duration: u32, // minutes
    pub rest_increment: u32,     // minutes per cycle
    pub max_rest_duration: u32,  // minutes
    pub long_break_duration: u32,
    pub fatigue_threshold: u32,  // points
    pub sound_enabled: bool,
    pub auto_start_next: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            work_duration: 25,
            ai_duration: 20,
            base_rest_duration: 5,
            rest_increment: 2,
            max_rest_duration: 20,
            long_break_duration: 25,
            fatigue_threshold: 60,
            sound_enabled: true,
            auto_start_next: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionCounts {
    pub work: u32,
    pub ai: u32,
    pub long_breaks: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub phase: Phase,
    pub phase_label: String,
    pub phase_color: String,
    pub phase_sublabel: String,
    pub time_display: String,
    pub progress: f64,          // 0.0 to 1.0
    pub is_running: bool,
    pub phase_elapsed: u32,     // seconds
    pub phase_duration: u32,    // seconds
    pub fatigue: f64,
    pub fatigue_threshold: u32,
    pub fatigue_percent: f64,
    pub cycle_count: u32,
    pub phase_index: usize,
    pub sessions_completed: SessionCounts,
    pub total_work_minutes: u32,
    pub total_ai_minutes: u32,
    pub progressive_rest: u32,
    pub cycle_order: Vec<Phase>,
}

pub struct TimerEngine {
    pub settings: Settings,
    pub phase: Phase,
    pub phase_index: usize,
    pub cycle_count: u32,
    pub fatigue: f64,
    pub sessions_completed: SessionCounts,
    pub total_work_minutes: u32,
    pub total_ai_minutes: u32,
    pub phase_elapsed: u32,
    pub phase_duration: u32,
    pub is_running: bool,
    pub total_elapsed: u32,
}

// The cycle order: [Work, Rest, Work, Rest, AI, Rest]
const CYCLE_ORDER: [Phase; 6] = [
    Phase::Work,
    Phase::Rest,
    Phase::Work,
    Phase::Rest,
    Phase::Ai,
    Phase::Rest,
];

impl TimerEngine {
    pub fn new(settings: Settings) -> Self {
        let phase_duration = settings.work_duration * 60;
        Self {
            settings,
            phase: Phase::Work,
            phase_index: 0,
            cycle_count: 0,
            fatigue: 0.0,
            sessions_completed: SessionCounts {
                work: 0,
                ai: 0,
                long_breaks: 0,
            },
            total_work_minutes: 0,
            total_ai_minutes: 0,
            phase_elapsed: 0,
            phase_duration,
            is_running: false,
            total_elapsed: 0,
        }
    }

    fn get_phase_duration(&self, phase: &Phase) -> u32 {
        match phase {
            Phase::Work => self.settings.work_duration * 60,
            Phase::Ai => self.settings.ai_duration * 60,
            Phase::Rest => self.get_progressive_rest() * 60,
            Phase::LongBreak => self.settings.long_break_duration * 60,
        }
    }

    fn get_progressive_rest(&self) -> u32 {
        let increment = (self.cycle_count * self.settings.rest_increment)
            .min(self.settings.max_rest_duration - self.settings.base_rest_duration);
        self.settings.base_rest_duration + increment
    }

    fn should_long_break(&self) -> bool {
        self.fatigue >= self.settings.fatigue_threshold as f64
    }

    pub fn tick(&mut self) -> bool {
        // Returns true if phase changed
        if !self.is_running {
            return false;
        }

        self.phase_elapsed += 1;
        self.total_elapsed += 1;

        if self.phase_elapsed >= self.phase_duration {
            self.complete_phase();
            true
        } else {
            false
        }
    }

    fn complete_phase(&mut self) {
        let completed_phase = self.phase.clone();

        // Track fatigue
        match completed_phase {
            Phase::Work => {
                self.fatigue += self.settings.work_duration as f64;
                self.sessions_completed.work += 1;
                self.total_work_minutes += self.settings.work_duration;
            }
            Phase::Ai => {
                self.fatigue += (self.settings.ai_duration as f64) * 0.5;
                self.sessions_completed.ai += 1;
                self.total_ai_minutes += self.settings.ai_duration;
            }
            _ => {}
        }

        // Check for long break
        if self.should_long_break() && completed_phase != Phase::LongBreak {
            self.transition_to(Phase::LongBreak);
            self.sessions_completed.long_breaks += 1;
            return;
        }

        // After long break, reset
        if completed_phase == Phase::LongBreak {
            self.fatigue = 0.0;
            self.cycle_count = 0;
            self.phase_index = 0;
            self.transition_to(CYCLE_ORDER[0].clone());
            return;
        }

        // Normal cycle progression
        self.phase_index += 1;
        if self.phase_index >= CYCLE_ORDER.len() {
            self.phase_index = 0;
            self.cycle_count += 1;
        }

        self.transition_to(CYCLE_ORDER[self.phase_index].clone());
    }

    fn transition_to(&mut self, phase: Phase) {
        self.phase = phase;
        self.phase_elapsed = 0;
        self.phase_duration = self.get_phase_duration(&self.phase);
    }

    pub fn toggle(&mut self) {
        self.is_running = !self.is_running;
    }

    pub fn skip(&mut self) {
        self.phase_elapsed = self.phase_duration;
        self.complete_phase();
    }

    pub fn reset(&mut self) {
        self.phase = Phase::Work;
        self.phase_index = 0;
        self.cycle_count = 0;
        self.fatigue = 0.0;
        self.sessions_completed = SessionCounts {
            work: 0,
            ai: 0,
            long_breaks: 0,
        };
        self.total_work_minutes = 0;
        self.total_ai_minutes = 0;
        self.phase_elapsed = 0;
        self.phase_duration = self.settings.work_duration * 60;
        self.is_running = false;
        self.total_elapsed = 0;
    }

    pub fn get_state(&self) -> TimerState {
        let remaining = self
            .phase_duration
            .checked_sub(self.phase_elapsed)
            .unwrap_or(0);
        let mins = remaining / 60;
        let secs = remaining % 60;
        let progress = if self.phase_duration > 0 {
            self.phase_elapsed as f64 / self.phase_duration as f64
        } else {
            0.0
        };
        let fatigue_percent = if self.settings.fatigue_threshold > 0 {
            (self.fatigue / self.settings.fatigue_threshold as f64 * 100.0).min(100.0)
        } else {
            0.0
        };

        TimerState {
            phase: self.phase.clone(),
            phase_label: self.phase.label().to_string(),
            phase_color: self.phase.color().to_string(),
            phase_sublabel: self.phase.sublabel().to_string(),
            time_display: format!("{:02}:{:02}", mins, secs),
            progress,
            is_running: self.is_running,
            phase_elapsed: self.phase_elapsed,
            phase_duration: self.phase_duration,
            fatigue: self.fatigue,
            fatigue_threshold: self.settings.fatigue_threshold,
            fatigue_percent,
            cycle_count: self.cycle_count,
            phase_index: self.phase_index,
            sessions_completed: self.sessions_completed.clone(),
            total_work_minutes: self.total_work_minutes,
            total_ai_minutes: self.total_ai_minutes,
            progressive_rest: self.get_progressive_rest(),
            cycle_order: CYCLE_ORDER.to_vec(),
        }
    }
}

// ─── App State ─────────────────────────────────────────────────

pub struct AppState {
    pub timer: Mutex<TimerEngine>,
}

// ─── IPC Commands ──────────────────────────────────────────────

#[tauri::command]
fn get_state(state: State<AppState>) -> TimerState {
    state.timer.lock().unwrap().get_state()
}

#[tauri::command]
fn toggle_timer(state: State<AppState>) -> TimerState {
    let mut timer = state.timer.lock().unwrap();
    timer.toggle();
    timer.get_state()
}

#[tauri::command]
fn skip_phase(state: State<AppState>) -> TimerState {
    let mut timer = state.timer.lock().unwrap();
    timer.skip();
    timer.get_state()
}

#[tauri::command]
fn reset_timer(state: State<AppState>) -> TimerState {
    let mut timer = state.timer.lock().unwrap();
    timer.reset();
    timer.get_state()
}

#[tauri::command]
fn get_settings(state: State<AppState>) -> Settings {
    state.timer.lock().unwrap().settings.clone()
}

#[tauri::command]
fn save_settings(state: State<AppState>, settings: Settings) -> TimerState {
    let mut timer = state.timer.lock().unwrap();
    timer.settings = settings;
    timer.phase_duration = timer.get_phase_duration(&timer.phase);
    timer.get_state()
}

// ─── Window Commands ───────────────────────────────────────────

#[tauri::command]
fn show_pip(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("pip") {
        let _ = win.show();
        let _ = win.set_always_on_top(true);
    }
}

#[tauri::command]
fn hide_pip(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("pip") {
        let _ = win.hide();
    }
}

#[tauri::command]
fn toggle_pip(app: tauri::AppHandle) -> bool {
    if let Some(win) = app.get_webview_window("pip") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
            false
        } else {
            let _ = win.show();
            let _ = win.set_always_on_top(true);
            true
        }
    } else {
        false
    }
}

#[tauri::command]
fn focus_main(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.set_focus();
    }
}

// ─── Notification ──────────────────────────────────────────────

#[tauri::command]
fn send_notification(app: tauri::AppHandle, title: String, body: String) {
    tauri::notification::Builder::new(&app)
        .title(&title)
        .body(&body)
        .show()
        .unwrap_or(());
}

// ─── Main ──────────────────────────────────────────────────────

fn main() {
    let settings = Settings::default();
    let timer_engine = TimerEngine::new(settings);

    let tray_menu = SystemTrayMenu::new()
        .add_item(tauri::TrayMenuItem::with_id("show", "Show FocusFloat", true, None))
        .add_item(tauri::TrayMenuItem::with_id("pip", "Toggle PiP", true, None))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::TrayMenuItem::with_id("quit", "Quit", true, None));

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState {
            timer: Mutex::new(timer_engine),
        })
        .system_tray(tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "pip" => {
                        let _ = toggle_pip(app.clone());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                },
                SystemTrayEvent::LeftClick { .. } => {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.set_focus();
                    }
                }
                _ => {}
            }
        })
        .setup(|app| {
            // Timer tick loop
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut ticker = interval(Duration::from_secs(1));
                loop {
                    ticker.tick().await;
                    let state = app_handle.state::<AppState>();
                    let mut timer = state.timer.lock().unwrap();
                    let phase_changed = timer.tick();
                    let state_data = timer.get_state();
                    drop(timer); // Release lock before emitting

                    // Emit to all windows
                    let _ = app_handle.emit("timer-tick", &state_data);
                    if phase_changed {
                        let _ = app_handle.emit("phase-change", &state_data);
                    }
                }
            });

            // Setup PiP window
            if let Some(pip_win) = app.get_webview_window("pip") {
                let pip_win_clone = pip_win.clone();
                pip_win.on_window_event(move |event| {
                    if let WindowEvent::Focused(focused) = event {
                        // Keep PiP always on top when focused
                        if *focused {
                            let _ = pip_win_clone.set_always_on_top(true);
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_state,
            toggle_timer,
            skip_phase,
            reset_timer,
            get_settings,
            save_settings,
            show_pip,
            hide_pip,
            toggle_pip,
            focus_main,
            send_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running FocusFloat");
}
