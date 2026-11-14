const { contextBridge, ipcRenderer } = require('electron');
const on = (ch, cb) => ipcRenderer.on(ch, (_e, ...a) => cb(...a));
contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  set: (p) => ipcRenderer.invoke('settings:set', p),
  reset: () => ipcRenderer.invoke('settings:reset'),
  onSettings: (cb) => on('settings:changed', cb),
  onEdit: (cb) => on('edit', cb),
  getEdit: () => ipcRenderer.invoke('edit:get'),
  onNextPreset: (cb) => on('next-preset', cb),
  toggleEdit: () => ipcRenderer.send('edit:toggle'),
  drag: (dx, dy) => ipcRenderer.send('drag', dx, dy),
  dragEnd: () => ipcRenderer.send('drag:end'),
  resizeBy: (f) => ipcRenderer.send('resizeBy', f),
  retryCapture: () => ipcRenderer.send('capture:retry'),
  listPresets: () => ipcRenderer.invoke('preset:list'),
  applyPreset: (s) => ipcRenderer.invoke('preset:apply', s),
  importPresets: () => ipcRenderer.invoke('preset:import'),
  savePreset: (name) => ipcRenderer.invoke('preset:save', name),
  openPresetFolder: () => ipcRenderer.send('preset:folder'),
  milkdropUser: () => ipcRenderer.invoke('milkdrop:user'),
  hotkeysFailed: () => ipcRenderer.invoke('hotkeys:failed'),
});
