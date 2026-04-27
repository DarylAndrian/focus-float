# 🍅 FocusFloat

> Enhanced Pomodoro timer with floating (PiP-like) timer — pure web app

FocusFloat uses a smarter timeboxing model: **Work → Rest → Work → Rest → AI Handling → Rest** with progressive rest durations that increase as your fatigue accumulates. After a fatigue threshold is reached, a long break resets you for the next round.

## ✨ Features

- ⚛️ **React (Vite) PWA** — Runs fully in the browser, installable
- 🔲 **Floating Timer UI** — Stays visible and on-top within the browser
- 🧠 **Progressive Rest** — Rest durations grow as fatigue accumulates
- 🤖 **AI Handling Phase** — Dedicated semi-work phase (counts as 0.5× fatigue)
- 😴 **Long Break Reset** — Automatic long break when fatigue threshold is reached
- 🔔 **Web Notifications** — Browser notifications on phase changes (with permission)
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
| AI Handling (20m) | +10 (0.5×) |
| Rest | Recovery |

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
│   ├── App.jsx            # Main window
│   ├── styles.css
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
