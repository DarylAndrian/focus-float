# 🍅 FocusFloat

> Enhanced Pomodoro timer with floating (PiP-like) timer — pure web app

FocusFloat uses a smarter timeboxing model: **Work → Rest → Work → Rest → AI Handling → Rest** with progressive rest durations that increase as your fatigue accumulates. After a fatigue threshold is reached, a long break resets you for the next round.

## ✨ Features

- ⚛️ **React (Vite) PWA** — Runs fully in the browser, installable
- 🔲 **Floating Timer UI** — Stays visible and on-top within the browser
- 🧠 **Progressive Rest** — Rest durations grow as fatigue accumulates
- 🤖 **AI Handling Phase** — Dedicated semi-work phase (counts as 0.5× fatigue)
- 😴 **Long Break Reset** — Automatic long break when fatigue threshold is reached
- 🔔 **Sound Notifications** — Distinct audio alerts per phase (Work/Rest/AI/Long Break)
- 💃 **Visual Alerts** — Full-screen flash + dancing stickmen during rest
- 🚨 **Forced Rest Mode** — Blocks UI during rest with dancing stickmen (emergency skip available)
- 🎨 **Dark Mode** — Toggle light/dark theme
- ⚙️ **Customizable Settings** — All durations, thresholds, and toggles tunable

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
| AI Handling (20m) | +10 (0.5×) |
| Rest | Recovery |

## 🆕 What's New

### v1.1 — Sound + Visual Overhaul
- **Sound notifications** — 3-tone beep patterns unique to each phase
- **Visual alert flash** — Color-coded full-screen flash on phase change
- **Forced Rest Mode** — Dancing stickmen appear during rest (can't skip unless emergency)
- **Emergency Skip button** — Red pulsing button to bypass forced rest in urgent situations
- **Settings toggles** — Enable/disable sound, visual alerts, and forced rest independently

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+

### Install & Run (dev)

```bash
git clone https://github.com/DarylAndrian/focus-float.git
cd focus-float
npm install
npm run dev
```

Open http://localhost:5173

### Build (production)

```bash
npm run build
```

Static output in `dist/` — deploy anywhere (GitHub Pages, Netlify, Vercel, etc.).

## ⌨️ Keyboard Shortcuts

- No global shortcuts in the web version; interactions are in-app.

## 🛠 Tech Stack

- **[React 19](https://react.dev/)** — UI framework
- **[Vite](https://vitejs.dev/)** — Build tool & dev server
- **Web Audio API** — Sound notifications
- **CSS Animations** — Dancing stickmen, visual alerts
- Plain JS timer engine (no Rust/Tauri)

## 📁 Project Structure

```
focus-float/
├── src/                   # React frontend
│   ├── components/        # React components
│   │   ├── TimerRing.jsx
│   │   ├── FatigueBar.jsx
│   │   ├── CycleDots.jsx
│   │   ├── StatsRow.jsx
│   │   └── SettingsPanel.jsx
│   ├── hooks/             # Timer & state logic
│   │   └── useTimer.js
│   ├── App.jsx            # Main window + forced rest overlay
│   ├── styles.css         # All styles (including stickmen animations)
│   └── main.jsx
├── index.html             # Main entry
├── public/                # Static assets & PWA manifest
├── package.json
├── vite.config.js
└── README.md
```

## 📝 License

MIT

---

Built by Daryl Andrian
