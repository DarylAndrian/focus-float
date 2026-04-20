const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusfloat', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_, settings) => callback(settings)),

  // PiP
  togglePip: () => ipcRenderer.invoke('toggle-pip'),
  openPip: () => ipcRenderer.invoke('open-pip'),
  closePip: () => ipcRenderer.invoke('close-pip'),
  onPipClosed: (callback) => ipcRenderer.on('pip-closed', callback),

  // Timer state sync
  sendTimerState: (state) => ipcRenderer.send('timer-state', state),
  onTimerStateSync: (callback) => ipcRenderer.on('timer-state-sync', (_, state) => callback(state)),

  // Window controls
  minimizeMain: () => ipcRenderer.invoke('minimize-main'),
  closeMain: () => ipcRenderer.invoke('close-main'),

  // Notifications
  showNotification: ({ title, body }) => ipcRenderer.invoke('show-notification', { title, body }),
});
