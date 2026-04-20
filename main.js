const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let pipWindow = null;
let tray = null;

// ─── Config ─────────────────────────────────────────────────────
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
  darkMode: true,
};

let settings = { ...DEFAULT_SETTINGS };

// ─── Main Window ────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 680,
    resizable: false,
    title: 'FocusFloat',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#1a1a2e',
    icon: path.join(__dirname, 'src/assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (pipWindow && !pipWindow.isDestroyed()) {
      // Don't quit if PiP is still open
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── PiP Window ─────────────────────────────────────────────────
function createPipWindow() {
  if (pipWindow && !pipWindow.isDestroyed()) {
    pipWindow.focus();
    return;
  }

  pipWindow = new BrowserWindow({
    width: 220,
    height: 160,
    alwaysOnTop: true,
    frame: false,
    resizable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    skipTaskbar: true,
    title: 'FocusFloat PiP',
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'src/assets/icon.png'),
  });

  pipWindow.loadFile(path.join(__dirname, 'src/renderer/pip.html'));

  pipWindow.on('closed', () => {
    pipWindow = null;
    // Notify main window that PiP closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('pip-closed');
    }
  });
}

function closePipWindow() {
  if (pipWindow && !pipWindow.isDestroyed()) {
    pipWindow.close();
    pipWindow = null;
  }
}

// ─── Tray ───────────────────────────────────────────────────────
function createTray() {
  // Use a simple icon
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show FocusFloat', click: () => {
      if (mainWindow) mainWindow.show();
      else createMainWindow();
    }},
    { label: 'Toggle PiP', click: () => {
      if (pipWindow && !pipWindow.isDestroyed()) closePipWindow();
      else createPipWindow();
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('FocusFloat');
  tray.setContextMenu(contextMenu);
}

// ─── IPC Handlers ───────────────────────────────────────────────

// Settings
ipcMain.handle('get-settings', () => settings);
ipcMain.handle('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  // Broadcast to both windows
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', settings);
  }
  if (pipWindow && !pipWindow.isDestroyed()) {
    pipWindow.webContents.send('settings-updated', settings);
  }
  return settings;
});

// PiP toggle
ipcMain.handle('toggle-pip', () => {
  if (pipWindow && !pipWindow.isDestroyed()) {
    closePipWindow();
    return false;
  } else {
    createPipWindow();
    return true;
  }
});

ipcMain.handle('open-pip', () => {
  createPipWindow();
  return true;
});

ipcMain.handle('close-pip', () => {
  closePipWindow();
  return false;
});

// Timer state sync
ipcMain.on('timer-state', (event, state) => {
  // Forward timer state from main to pip or vice versa
  const target = event.sender === mainWindow?.webContents ? pipWindow : mainWindow;
  if (target && !target.isDestroyed()) {
    target.webContents.send('timer-state-sync', state);
  }
});

// Window controls
ipcMain.handle('minimize-main', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('close-main', () => {
  if (mainWindow) mainWindow.close();
});

// Notification
ipcMain.handle('show-notification', (event, { title, body }) => {
  const { Notification } = require('electron');
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// ─── App Lifecycle ──────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();
  createTray();

  // Global shortcut: Cmd/Ctrl+Shift+F to toggle PiP
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    if (pipWindow && !pipWindow.isDestroyed()) closePipWindow();
    else createPipWindow();
  });
});

app.on('window-all-closed', () => {
  // Don't quit on macOS
  if (process.platform !== 'darwin') {
    // If PiP exists, keep running
    if (pipWindow && !pipWindow.isDestroyed()) return;
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
