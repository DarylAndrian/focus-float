# 🍅 FocusFloat

> Enhanced Pomodoro timer with floating PiP window — built with Rust + React

FocusFloat uses a smarter timeboxing model: **Work → Rest → Work → Rest → AI Handling → Rest** with progressive rest durations that increase as your fatigue accumulates. After a fatigue threshold is reached, a long break resets you for the next round.

## ✨ Features

- 🦀 **Rust Backend** — Rock-solid timer engine, zero drift, ~8MB binary
- ⚛️ **React Frontend** — Clean UI with smooth animations
- 🔲 **Floating PiP Timer** — Always-on-top mini timer that stays visible over any app
- 🧠 **Progressive Rest** — Rest durations grow as fatigue accumulates
- 🤖 **AI Handling Phase** — Dedicated semi-work phase (counts as 0.5x fatigue)
- 😴 **Long Break Reset** — Automatic long break when fatigue threshold is reached
- 🔔 **System Notifications** — Native OS notifications on phase changes
- ⚙️ **Customizable Settings** — All durations and thresholds are tunable

## 🔄 Cycle Flow

```
[Work 25m] → [Rest 5m] → [Work 25m] → [Rest 8m] → [AI 20m] → [Rest 5m]
     ↑                                                        │
     └──────────────────── loop ──────────────────────────────┘

When fatigue ≥ 60 points → [Long Break 25m] → fatigue reset → repeat
```

### Fatigue Model

| Phase | Fatigue Points |
|-------|---------------|
| Work (25m) | +25 |
| AI Handling (20m) | +10 (0.5x) |
| Rest | Recovery |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (for Tauri backend)
- OS dependencies for Tauri: https://v2.tauri.app/start/prerequisites/

### Install & Run

```bash
# Clone the repo
git clone https://github.com/DarylAndrian/focus-float.git
cd focus-float

# Install frontend deps
npm install

# Run in dev mode
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Output binary: `src-tauri/target/release/bundle/`

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| System tray | Show/Hide, Toggle PiP, Quit |

## 🛠 Tech Stack

- **[Tauri v2](https://v2.tauri.app/)** — Desktop app framework (Rust backend)
- **[React 19](https://react.dev/)** — UI framework
- **[Vite](https://vitejs.dev/)** — Build tool
- **[Rust](https://www.rust-lang.org/)** — Timer engine & window management

## 📁 Project Structure

```
focus-float/
├── src-tauri/             # Rust backend
│   ├── src/
│   │   └── main.rs        # Timer engine + IPC + windows
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                   # React frontend
│   ├── components/        # React components
│   │   ├── TimerRing.jsx
│   │   ├── FatigueBar.jsx
│   │   ├── CycleDots.jsx
│   │   ├── StatsRow.jsx
│   │   └── SettingsPanel.jsx
│   ├── App.jsx            # Main window
│   ├── PipApp.jsx         # PiP window
│   ├── styles.css
│   └── main.jsx
├── index.html             # Main entry
├── pip.html               # PiP entry
├── vite.config.js
└── package.json
```

## 📝 License

MIT

---

Built by Daryl Andrian
