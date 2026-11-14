const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, session, desktopCapturer, dialog, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { i18n } = require('./i18n');

if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

const MODES = ['bars', 'mirror', 'radial', 'wave', 'scope', 'particles', 'orb', 'spectrogram', 'tunnel', 'starfield', 'rings', 'ridge', 'led', 'aurora', 'kaleido', 'helix', 'fireworks', 'milkdrop'];
const DEFAULTS = {
  lang: 'en', mode: 'bars', opacity: 0.9, width: 900, height: 260, fullWidth: false, edgeFade: 15, bars: 64, barGap: 0.25,
  colorA: '#7c5cff', colorB: '#00e0ff', rainbow: false, hueSpeed: 40,
  sensitivity: 1.4, smoothing: 0.8, fps: 60, autoHide: true,
  glow: 14, blur: 0, pulse: 0.08, trails: 0, rotation: 0, spin: 0, flipV: false, flipH: false,
  alwaysOnTop: true, clickThrough: true, wallpaperMode: false, wpAnchor: 'bottom', wpFull: false, autoStart: false,
  milkdropPreset: '', milkdropCycle: 30, bounds: null, firstRunDone: false,
};
const STYLE_EXCLUDE = ['lang', 'bounds', 'alwaysOnTop', 'clickThrough', 'wallpaperMode', 'wpAnchor', 'wpFull', 'autoStart', 'firstRunDone', 'width', 'height', 'fullWidth'];
const SEED = {
  'Neon Pulse': { mode: 'bars', colorA: '#ff2bd6', colorB: '#00e5ff', glow: 24, pulse: 0.12, bars: 48, barGap: 0.3 },
  'Rainbow Mirror': { mode: 'mirror', rainbow: true, hueSpeed: 60, glow: 10, bars: 72, barGap: 0.2 },
  'Radial Sun': { mode: 'radial', colorA: '#ffb300', colorB: '#ff3d00', glow: 30, spin: 20, pulse: 0.15, bars: 96 },
  'Ocean Wave': { mode: 'wave', colorA: '#00c6ff', colorB: '#0072ff', glow: 16, trails: 0.2 },
  'Phosphor Scope': { mode: 'scope', colorA: '#39ff14', colorB: '#b6ff00', glow: 20, trails: 0.35 },
  'Fireflies': { mode: 'particles', colorA: '#ffd54f', colorB: '#ff6e40', glow: 18 },
  'Lava Orb': { mode: 'orb', colorA: '#ff1744', colorB: '#ff9100', glow: 34, pulse: 0.2 },
  'Heat Waterfall': { mode: 'spectrogram', colorA: '#1a0033', colorB: '#ffea00', glow: 0 },
  'Hyperspace': { mode: 'starfield', colorA: '#9be7ff', colorB: '#ffffff', glow: 10, pulse: 0.04, fps: 60 },
  'Warp Tunnel': { mode: 'tunnel', rainbow: true, hueSpeed: 50, glow: 18, pulse: 0.1 },
  'Neon Tunnel': { mode: 'tunnel', colorA: '#ff00aa', colorB: '#00e5ff', glow: 24, spin: 12 },
  'Ripple Pond': { mode: 'rings', colorA: '#4dd0e1', colorB: '#7c4dff', glow: 16 },
  'Unknown Pulsar': { mode: 'ridge', colorA: '#ffffff', colorB: '#9aa5ff', glow: 8, sensitivity: 1.8 },
  'LED Equalizer': { mode: 'led', colorA: '#39ff14', colorB: '#ff1744', bars: 28, barGap: 0.2, glow: 6 },
  'Aurora Borealis': { mode: 'aurora', colorA: '#00ffa3', colorB: '#7c5cff', glow: 12, opacity: 0.85 },
  'Kaleidoscope': { mode: 'kaleido', rainbow: true, hueSpeed: 40, glow: 16 },
  'Fireworks Night': { mode: 'fireworks', rainbow: true, hueSpeed: 80, glow: 14 },
  'DNA Helix': { mode: 'helix', colorA: '#00e0ff', colorB: '#ff2bd6', glow: 14, bars: 48 },
  'Sunset Mirror': { mode: 'mirror', colorA: '#ff9a3c', colorB: '#ff2e63', glow: 20, bars: 56, barGap: 0.3 },
  'Cyber Radial': { mode: 'radial', colorA: '#00fff0', colorB: '#ff00e5', glow: 22, spin: -15, bars: 72 },
  'Lava Lamp': { mode: 'orb', colorA: '#ff6a00', colorB: '#ee0979', blur: 3, glow: 20, pulse: 0.1 },
  'Ghost Wave': { mode: 'wave', colorA: '#ffffff', colorB: '#7c5cff', glow: 25, trails: 0.55 },
  'Sparkle Rain': { mode: 'particles', rainbow: true, hueSpeed: 90, glow: 12 },
  'Fire Spectrum': { mode: 'bars', colorA: '#ffea00', colorB: '#ff1100', bars: 96, barGap: 0.1, glow: 18 },
};

let settings = { ...DEFAULTS }, overlay = null, settingsWin = null, tray = null, editMode = false, visible = true, saveTimer, editTimer;
const failedKeys = [];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const safeName = (n) => String(n).replace(/[^\w\- ]/g, '_').slice(0, 60) || 'preset';
const dir = (n) => { const p = path.join(app.getPath('userData'), n); fs.mkdirSync(p, { recursive: true }); return p; };
const cfgFile = () => path.join(app.getPath('userData'), 'settings.json');
const preload = () => path.join(__dirname, 'preload.js');
const tt = (k) => i18n(settings.lang || 'en', k);

function loadSettings() { try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(cfgFile(), 'utf8')) }; } catch { settings = { ...DEFAULTS }; } }
function saveSettings() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { fs.writeFileSync(cfgFile(), JSON.stringify(settings, null, 2)); } catch {} }, 300); }
function seedPresets() {
  const d = dir('presets'); dir('milkdrop');
  for (const [name, s] of Object.entries(SEED)) {
    const f = path.join(d, safeName(name) + '.json');
    if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify({ name, settings: s }, null, 2));
  }
}
function readJsonDir(d) {
  return fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => {
    try { return { file: f, data: JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')) }; } catch { return null; }
  }).filter(Boolean);
}

function getBounds() {
  const h = settings.height, b = settings.bounds, wa = screen.getPrimaryDisplay().workArea, w = settings.width;
  let x = Math.round(wa.x + (wa.width - w) / 2), y = Math.round(wa.y + wa.height - h - 20);
  if (b && b.x != null) { x = b.x; y = b.y; }
  if (settings.fullWidth) { const d = screen.getDisplayMatching({ x, y, width: w, height: h }); return { x: d.bounds.x, y, width: d.bounds.width, height: h }; }
  return { x, y, width: w, height: h };
}
function broadcast() { for (const w of [overlay, settingsWin]) if (w && !w.isDestroyed()) w.webContents.send('settings:changed', settings); }
function sendEdit() { for (const w of [overlay, settingsWin]) if (w && !w.isDestroyed()) w.webContents.send('edit', editMode); }
function startCapture() {
  if (overlay && !overlay.isDestroyed()) overlay.webContents.executeJavaScript('window.__startCapture&&window.__startCapture()', true).catch(() => {});
}
// Klik tembus: pakai setIgnoreMouseEvents(true) polos (tanpa forward) supaya klik benar-benar lewat ke jendela di bawahnya.
function applyClickThrough() {
  if (!overlay || overlay.isDestroyed()) return;
  const ignore = settings.wallpaperMode || (settings.clickThrough && !editMode);
  overlay.setIgnoreMouseEvents(ignore);
  overlay.setFocusable(editMode);
}
function savePos() { if (overlay && !overlay.isDestroyed()) { const b = overlay.getBounds(); settings.bounds = { x: b.x, y: b.y }; saveSettings(); } }

function createOverlay() {
  if (overlay && !overlay.isDestroyed()) overlay.destroy();
  const wp = settings.wallpaperMode;
  editMode = false; clearTimeout(editTimer);
  const b = wp ? screen.getPrimaryDisplay().bounds : getBounds();
  overlay = new BrowserWindow({
    ...b, transparent: true, frame: false, resizable: false, skipTaskbar: true, hasShadow: false,
    focusable: false, show: false, backgroundColor: '#00000000', alwaysOnTop: !wp && settings.alwaysOnTop,
    webPreferences: { preload: preload(), contextIsolation: true, backgroundThrottling: false },
  });
  if (!wp && settings.alwaysOnTop) overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.loadFile(path.join(__dirname, 'overlay.html'));
  overlay.webContents.on('did-finish-load', () => { startCapture(); applyClickThrough(); });
  overlay.on('show', applyClickThrough);
  overlay.once('ready-to-show', () => {
    if (visible) overlay.showInactive();
    if (wp) {
      let ok = false;
      try {
        const wpm = require('./wallpaper');
        ok = wpm.attach(Number(overlay.getNativeWindowHandle().readBigUInt64LE(0)), wpm.rect(screen));
      } catch (e) { console.error('wallpaper mode failed:', e); }
      if (!ok) {
        settings.wallpaperMode = false; saveSettings();
        dialog.showErrorBox(tt('wp_fail_t'), tt('wp_fail_m'));
        createOverlay(); broadcast(); updateTray(); return;
      }
    }
    applyClickThrough();
  });
}

function setSize(w, h) {
  settings.width = clamp(Math.round(w), 120, 7680); settings.height = clamp(Math.round(h), 60, 2160);
  if (!overlay || overlay.isDestroyed() || settings.wallpaperMode) return;
  const b = overlay.getBounds(), cy = b.y + b.height / 2;
  let nb;
  if (settings.fullWidth) {
    const d = screen.getDisplayMatching(b);
    nb = { x: d.bounds.x, y: Math.round(cy - settings.height / 2), width: d.bounds.width, height: settings.height };
  } else {
    const cx = b.x + b.width / 2;
    nb = { x: Math.round(cx - settings.width / 2), y: Math.round(cy - settings.height / 2), width: settings.width, height: settings.height };
  }
  overlay.setBounds(nb); settings.bounds = { x: nb.x, y: nb.y };
}

function applyPatch(p) {
  const old = { ...settings };
  Object.assign(settings, p);
  if ('width' in p || 'height' in p || 'fullWidth' in p) setSize(settings.width, settings.height);
  if (p.wallpaperMode !== undefined && p.wallpaperMode !== old.wallpaperMode) createOverlay();
  if (p.alwaysOnTop !== undefined && overlay && !overlay.isDestroyed() && !settings.wallpaperMode) overlay.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
  if (p.clickThrough !== undefined) applyClickThrough();
  if (p.autoStart !== undefined) app.setLoginItemSettings({ openAtLogin: !!settings.autoStart, path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath });
  saveSettings(); broadcast(); updateTray();
  return settings;
}

// Mode edit selalu punya jalan keluar: tombol Selesai, Esc, klik dua kali, tray, tombol di settings, dan auto-keluar 2 menit tanpa aktivitas.
function armEditTimer() { clearTimeout(editTimer); editTimer = setTimeout(() => { if (editMode) toggleEdit(); }, 120000); }
function toggleEdit() {
  if (!overlay || overlay.isDestroyed()) return;
  if (settings.wallpaperMode) { dialog.showErrorBox(tt('edit_wp_t'), tt('edit_wp_m')); return; }
  editMode = !editMode; applyClickThrough(); sendEdit();
  if (editMode) { visible = true; overlay.show(); overlay.focus(); armEditTimer(); }
  else { clearTimeout(editTimer); savePos(); }
  updateTray();
}
function toggleVisible() { if (!overlay || overlay.isDestroyed()) return; visible = !visible; visible ? overlay.showInactive() : overlay.hide(); updateTray(); }
function nextMode() { applyPatch({ mode: MODES[(MODES.indexOf(settings.mode) + 1) % MODES.length] }); }
function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({ width: 500, height: 820, title: 'Desktop Audio Visualizer', backgroundColor: '#0e0f14', autoHideMenuBar: true, webPreferences: { preload: preload(), contextIsolation: true } });
  settingsWin.removeMenu();
  settingsWin.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  settingsWin.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

function updateTray() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: tt('t_settings'), click: openSettings },
    { label: tt('t_show'), type: 'checkbox', checked: visible, click: toggleVisible },
    { label: tt('t_edit'), type: 'checkbox', checked: editMode, click: toggleEdit },
    { label: tt('t_next'), click: nextMode },
    { type: 'separator' },
    { label: tt('t_wp'), type: 'checkbox', checked: settings.wallpaperMode, click: (i) => applyPatch({ wallpaperMode: i.checked }) },
    { label: tt('t_top'), type: 'checkbox', checked: settings.alwaysOnTop, click: (i) => applyPatch({ alwaysOnTop: i.checked }) },
    { label: tt('t_ct'), type: 'checkbox', checked: settings.clickThrough, click: (i) => applyPatch({ clickThrough: i.checked }) },
    { type: 'separator' },
    { label: tt('t_quit'), click: () => app.quit() },
  ]));
}
function createTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, '..', 'build', 'icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(img); tray.setToolTip('Desktop Audio Visualizer'); tray.on('click', openSettings); updateTray();
}
function registerKeys() {
  const k = (a, f) => { let ok = false; try { ok = globalShortcut.register(a, f); } catch {} if (!ok) failedKeys.push(a.replace('CommandOrControl', 'Ctrl')); };
  k('CommandOrControl+Alt+V', toggleVisible);
  k('CommandOrControl+Alt+E', toggleEdit);
  k('CommandOrControl+Alt+S', openSettings);
  k('CommandOrControl+Alt+N', nextMode);
  k('CommandOrControl+Alt+P', () => { if (overlay && !overlay.isDestroyed()) overlay.webContents.send('next-preset'); });
}

ipcMain.handle('settings:get', () => settings);
ipcMain.handle('settings:set', (_e, p) => applyPatch(p || {}));
ipcMain.handle('settings:reset', () => applyPatch({ ...DEFAULTS, lang: settings.lang, bounds: settings.bounds, firstRunDone: true }));
ipcMain.handle('edit:get', () => editMode);
ipcMain.handle('hotkeys:failed', () => failedKeys);
ipcMain.on('edit:toggle', toggleEdit);
ipcMain.on('drag', (_e, dx, dy) => {
  if (!editMode || !overlay || overlay.isDestroyed()) return; armEditTimer();
  const b = overlay.getBounds();
  overlay.setBounds({ x: b.x + (settings.fullWidth ? 0 : Math.round(dx)), y: b.y + Math.round(dy), width: b.width, height: b.height });
});
ipcMain.on('drag:end', savePos);
ipcMain.on('resizeBy', (_e, f) => {
  if (!editMode) return; armEditTimer();
  setSize(settings.fullWidth ? settings.width : settings.width * f, settings.height * f); saveSettings(); broadcast();
});
ipcMain.on('capture:retry', () => setTimeout(startCapture, 3000));
ipcMain.on('preset:folder', () => shell.openPath(dir('presets')));
ipcMain.handle('preset:list', () => readJsonDir(dir('presets')).filter((x) => x.data && x.data.settings).map((x) => ({ name: x.data.name || x.file.replace(/\.json$/, ''), settings: x.data.settings })));
// Menerapkan preset: reset dulu semua setelan gaya ke default supaya sisa preset sebelumnya tidak ikut terbawa.
ipcMain.handle('preset:apply', (_e, s) => {
  const base = {}; for (const k of Object.keys(DEFAULTS)) if (!STYLE_EXCLUDE.includes(k)) base[k] = DEFAULTS[k];
  const clean = {}; for (const k of Object.keys(s || {})) if (!STYLE_EXCLUDE.includes(k)) clean[k] = s[k];
  return applyPatch({ ...base, ...clean });
});
ipcMain.handle('preset:save', (_e, name) => {
  const s = {}; for (const k of Object.keys(settings)) if (!STYLE_EXCLUDE.includes(k)) s[k] = settings[k];
  fs.writeFileSync(path.join(dir('presets'), safeName(name) + '.json'), JSON.stringify({ name, settings: s }, null, 2));
  return true;
});
ipcMain.handle('preset:import', async () => {
  const r = await dialog.showOpenDialog(settingsWin || undefined, { filters: [{ name: 'Preset JSON', extensions: ['json'] }], properties: ['openFile', 'multiSelections'] });
  if (r.canceled) return 0;
  let n = 0;
  for (const f of r.filePaths) {
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8')), base = safeName(path.basename(f, '.json'));
      if (j.settings) { fs.writeFileSync(path.join(dir('presets'), base + '.json'), JSON.stringify(j, null, 2)); n++; }
      else if (j.baseVals || j.shapes || j.init_eqs_str !== undefined) { fs.writeFileSync(path.join(dir('milkdrop'), base + '.json'), JSON.stringify(j)); n++; }
    } catch {}
  }
  return n;
});
ipcMain.handle('milkdrop:user', () => readJsonDir(dir('milkdrop')).map((x) => ({ name: '[user] ' + x.file.replace(/\.json$/, ''), preset: x.data })));

app.on('second-instance', openSettings);
app.on('window-all-closed', () => {});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.whenReady().then(() => {
  app.setAppUserModelId('com.desktopvisualizer.app');
  loadSettings(); seedPresets();
  session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(true));
  session.defaultSession.setDisplayMediaRequestHandler((_req, cb) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((src) => cb({ video: src[0], audio: 'loopback' })).catch(() => cb({}));
  });
  createOverlay(); createTray(); registerKeys();
  if (!settings.firstRunDone) { settings.firstRunDone = true; saveSettings(); openSettings(); }
});
