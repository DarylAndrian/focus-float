# 🍅 FocusFloat

> Enhanced Pomodoro timer with floating Picture-in-Picture window

FocusFloat uses a smarter timeboxing model: **Work → Rest → Work → Rest → AI Handling → Rest** with progressive rest durations that increase as your fatigue accumulates. After a fatigue threshold is reached, a long break resets you for the next round.

## ✨ Features

- 🔲 **Floating PiP Timer** — Always-on-top mini timer that stays visible over any app
- 🍅 **Enhanced Pomodoro Cycle** — Work (25m) → Rest → Work (25m) → Rest → AI Handling (20m) → Rest
- 🧠 **Progressive Rest** — Rest durations grow as fatigue accumulates
- 🤖 **AI Handling Phase** — Dedicated semi-work phase for AI tasks (counts as 0.5x fatigue)
- 😴 **Long Break Reset** — Automatic long break when fatigue threshold is reached
- 🔔 **Smart Notifications** — Sound alerts and system notifications on phase changes
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

After ~2 full cycles (~83min × 2 ≈ 2h 46min), fatigue hits the threshold and triggers a **25-minute long break**.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/DarylAndrian/focus-float.git
cd focus-float

# Install dependencies
npm install

# Run the app
npm start
```

### Build for Your Platform

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧F` / `Ctrl+Shift+F` | Toggle floating PiP window |

## 🛠 Tech Stack

- **[Electron](https://www.electronjs.org/)** — Desktop app framework
- **Vanilla JS** — No framework overhead, fast and light
- **Web Audio API** — Beep sounds without external files

## 📁 Project Structure

```
focus-float/
├── main.js              # Electron main process (2 windows)
├── preload.js           # Secure IPC bridge
├── src/
│   ├── core/
│   │   └── timer.js     # Timer engine (shared logic)
│   ├── renderer/
│   │   ├── index.html   # Full window
│   │   ├── pip.html     # PiP floating window
│   │   ├── style.css    # Shared styles
│   │   ├── app.js       # Full window controller
│   │   └── pip.js       # PiP window controller
│   └── assets/
│       └── icon.png
└── package.json
```

## 📝 License

MIT

---

Built by Daryl Andrian
