const $ = (s) => document.querySelector(s);
let S = {}, editOn = false, inputs = [], names = [];
const tr = (k) => i18n(S.lang || 'en', k);
const isMd = (s) => s.mode === 'milkdrop';
const notMd = (s) => !isMd(s);
const MODES = ['bars', 'mirror', 'radial', 'wave', 'scope', 'particles', 'orb', 'spectrogram', 'tunnel', 'starfield', 'rings', 'ridge', 'led', 'aurora', 'kaleido', 'helix', 'fireworks', 'milkdrop'];
const MODE_NAMES = { bars: 'Bars', mirror: 'Mirror bars', radial: 'Radial', wave: 'Waveform', scope: 'Oscilloscope', particles: 'Particles', orb: 'Orb', spectrogram: 'Spectrogram', tunnel: 'Warp tunnel', starfield: 'Starfield', rings: 'Ripple rings', ridge: 'Pulsar ridges', led: 'LED matrix', aurora: 'Aurora', kaleido: 'Kaleidoscope', helix: 'DNA helix', fireworks: 'Fireworks' };
const r = (k, min, max, step, show, toggle) => ({ k, type: 'range', min, max, step, show, toggle });
const c = (k, show) => ({ k, type: 'check', show });
const UI = [
  { t: 'sec_model', items: [{ k: 'mode', type: 'select', opts: 'modes' }, { k: 'milkdropPreset', type: 'select', opts: 'milkdrop', show: isMd }, r('milkdropCycle', 0, 120, 5, isMd)] },
  { t: 'sec_look', items: [
    r('opacity', 0.05, 1, 0.01), r('width', 200, 3840, 10, null, 'fullWidth'), r('height', 80, 2160, 10), r('edgeFade', 0, 45, 1),
    r('bars', 8, 256, 1, notMd), r('barGap', 0, 0.8, 0.01, notMd),
    { k: 'colorA', type: 'color', show: notMd }, { k: 'colorB', type: 'color', show: notMd },
    c('rainbow', notMd), r('hueSpeed', 0, 180, 1, (s) => notMd(s) && s.rainbow),
  ] },
  { t: 'sec_audio', items: [r('sensitivity', 0.2, 4, 0.05), r('smoothing', 0, 0.95, 0.01), r('fps', 15, 144, 1), c('autoHide')] },
  { t: 'sec_fx', items: [r('glow', 0, 60, 1), r('blur', 0, 12, 0.5), r('pulse', 0, 0.5, 0.01), r('trails', 0, 0.95, 0.01, notMd), r('rotation', -180, 180, 1), r('spin', -90, 90, 1), c('flipH'), c('flipV')] },
  { t: 'sec_window', items: [
    c('alwaysOnTop'), c('clickThrough'), c('wallpaperMode'),
    { k: 'wpAnchor', type: 'select', opts: 'anchors', show: (s) => s.wallpaperMode && !s.wpFull },
    c('wpFull', (s) => s.wallpaperMode), c('autoStart'),
  ] },
];
const fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : +(+v).toFixed(2));
function bp() { try { const p = window.butterchurnPresets; return (p.getPresets ? p : p.default).getPresets(); } catch { return {}; } }

function optsFor(it) {
  if (it.opts === 'modes') return MODES.map((m) => [m, m === 'milkdrop' ? tr('m_milkdrop') : MODE_NAMES[m]]);
  if (it.opts === 'milkdrop') return [['', tr('random')], ...names.map((n) => [n, n])];
  return ['bottom', 'bottom-left', 'bottom-right', 'top', 'center'].map((a) => [a, tr('a_' + a)]);
}

function render() {
  const root = $('#ui'); root.innerHTML = ''; inputs = [];
  for (const sec of UI) {
    const box = document.createElement('section'); box.innerHTML = `<h2>${tr(sec.t)}</h2>`;
    for (const it of sec.items) {
      const row = document.createElement(it.type === 'check' ? 'label' : 'div'); row.className = 'row';
      const name = document.createElement('span'); name.textContent = tr('l_' + it.k); row.append(name);
      let el, out = null, cb = null;
      if (it.type === 'select') {
        el = document.createElement('select'); optsFor(it).forEach(([v, l]) => el.add(new Option(l, v)));
        el.onchange = () => api.set({ [it.k]: el.value }); row.append(el);
      } else if (it.type === 'range') {
        const wrap = document.createElement('div'); wrap.className = 'ctl';
        el = document.createElement('input'); el.type = 'range'; el.min = it.min; el.max = it.max; el.step = it.step;
        out = document.createElement('output');
        el.oninput = () => { const v = parseFloat(el.value); out.textContent = fmt(v); api.set({ [it.k]: v }); };
        if (it.toggle) {
          const tg = document.createElement('label'); tg.className = 'tg'; tg.title = tr('l_fullWidth');
          cb = document.createElement('input'); cb.type = 'checkbox'; cb.onchange = () => api.set({ [it.toggle]: cb.checked });
          tg.append(cb, document.createTextNode(tr('l_full'))); wrap.append(tg);
        }
        wrap.append(el, out); row.append(wrap);
      } else if (it.type === 'color') {
        el = document.createElement('input'); el.type = 'color'; el.oninput = () => api.set({ [it.k]: el.value }); row.append(el);
      } else {
        el = document.createElement('input'); el.type = 'checkbox'; el.onchange = () => api.set({ [it.k]: el.checked }); row.append(el);
      }
      inputs.push({ it, el, out, row, cb }); box.append(row);
    }
    root.append(box);
  }
  refresh();
}
function refresh() {
  for (const { it, el, out, row, cb } of inputs) {
    const v = S[it.k];
    if (document.activeElement !== el) { if (it.type === 'check') el.checked = !!v; else el.value = v; }
    if (out) out.textContent = fmt(parseFloat(v));
    if (cb) { cb.checked = !!S[it.toggle]; el.disabled = !!S[it.toggle]; }
    row.style.display = it.show && !it.show(S) ? 'none' : '';
  }
}
function applyStatic() {
  document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = tr(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((e) => { e.placeholder = tr(e.dataset.i18nPh); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === (S.lang || 'en')));
  $('#edit').textContent = tr(editOn ? 'b_editDone' : 'b_edit');
  document.documentElement.lang = S.lang || 'en';
}
async function loadPresets() {
  const box = $('#presets'); box.innerHTML = '';
  (await api.listPresets()).forEach((p) => { const b = document.createElement('button'); b.textContent = p.name; b.onclick = () => api.applyPreset(p.settings); box.append(b); });
}
document.querySelectorAll('[data-lang]').forEach((b) => { b.onclick = () => api.set({ lang: b.dataset.lang }); });
$('#psave').onclick = async () => { const n = $('#pname').value.trim(); if (!n) return $('#pname').focus(); await api.savePreset(n); $('#pname').value = ''; loadPresets(); };
$('#pimport').onclick = async () => { await api.importPresets(); loadPresets(); };
$('#pfolder').onclick = () => api.openPresetFolder();
$('#edit').onclick = () => api.toggleEdit();
$('#reset').onclick = () => api.reset();
api.onEdit((v) => { editOn = v; applyStatic(); });
api.onSettings((s) => { const langChanged = s.lang !== S.lang; S = s; if (langChanged) { applyStatic(); render(); } else refresh(); });

(async () => {
  S = await api.getSettings(); editOn = await api.getEdit();
  names = Object.keys(bp()).sort();
  try { (await api.milkdropUser()).forEach((x) => names.push(x.name)); } catch {}
  applyStatic(); render(); loadPresets();
  const failed = await api.hotkeysFailed();
  if (failed.length) { const w = $('#hkwarn'); w.hidden = false; w.textContent = tr('hk_fail') + failed.join(', '); }
})();
