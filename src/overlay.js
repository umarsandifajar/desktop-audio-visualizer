const $ = (s) => document.querySelector(s);
const fadeEl = $('#fade'), stage = $('#stage'), cv = $('#c'), mdCv = $('#md'), ctx = cv.getContext('2d'), frameEl = $('#editFrame');
let S = {}, edit = false, analyser = null, ac = null;
let F = new Uint8Array(1024), T = new Uint8Array(2048).fill(128);
let silentFor = 0, fade = 1, last = 0, bassAvg = 0, lastBeat = -1;
const dpr = window.devicePixelRatio || 1, t0 = performance.now(), cache = {};
const COUNTS = { spectrogram: 64, particles: 32, tunnel: 48, rings: 32, ridge: 64, aurora: 16, kaleido: 32, helix: 48 };
const setStyle = (k, v) => { if (cache[k] !== v) { cache[k] = v; stage.style[k] = v; } };

/* ---------- audio (system loopback) ---------- */
async function initAudio() {
  try {
    const st = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    st.getVideoTracks().forEach((tr) => tr.stop());
    const at = st.getAudioTracks()[0];
    if (!at) throw new Error('no audio track');
    ac = new AudioContext();
    const src = ac.createMediaStreamSource(new MediaStream([at]));
    analyser = ac.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser); // tidak disambung ke speaker -> tanpa echo
    F = new Uint8Array(analyser.frequencyBinCount); T = new Uint8Array(analyser.fftSize);
    at.onended = () => { analyser = null; api.retryCapture(); };
  } catch (e) { console.error('capture failed', e); api.retryCapture(); }
}
window.__startCapture = initAudio;

/* ---------- milkdrop (butterchurn) ---------- */
let vis = null, mdPresets = {}, mdTimer = 0, mdSize = '';
async function ensureMilkdrop(W, H) {
  if (!analyser || typeof butterchurn === 'undefined') return;
  const size = `${Math.round(W * dpr)}x${Math.round(H * dpr)}`;
  if (!vis) {
    mdCv.width = Math.round(W * dpr); mdCv.height = Math.round(H * dpr); mdSize = size;
    const bc = butterchurn.default || butterchurn;
    vis = bc.createVisualizer(ac, mdCv, { width: mdCv.width, height: mdCv.height, pixelRatio: 1 });
    vis.connectAudio(analyser);
    const bp = window.butterchurnPresets; const base = bp.getPresets ? bp.getPresets() : bp.default.getPresets();
    mdPresets = { ...base };
    try { (await api.milkdropUser()).forEach((x) => { mdPresets[x.name] = x.preset; }); } catch {}
    loadMd(S.milkdropPreset, 0);
  } else if (size !== mdSize) { mdSize = size; mdCv.width = Math.round(W * dpr); mdCv.height = Math.round(H * dpr); vis.setRendererSize(mdCv.width, mdCv.height); }
}
function loadMd(name, blend = 2.5) {
  if (!vis) return; const keys = Object.keys(mdPresets); if (!keys.length) return;
  if (!mdPresets[name]) name = keys[Math.floor(Math.random() * keys.length)];
  vis.loadPreset(mdPresets[name], blend); mdTimer = 0;
}

/* ---------- layout, fade, language ---------- */
function layout() {
  const b = document.body.style;
  if (!S.wallpaperMode || S.wpFull) { fadeEl.style.width = '100%'; fadeEl.style.height = '100%'; b.justifyContent = b.alignItems = 'stretch'; b.padding = '0'; return; }
  fadeEl.style.width = S.fullWidth ? '100%' : S.width + 'px'; fadeEl.style.height = S.height + 'px'; b.padding = '24px';
  const a = S.wpAnchor || 'bottom';
  b.justifyContent = a.includes('left') ? 'flex-start' : a.includes('right') ? 'flex-end' : 'center';
  b.alignItems = a.startsWith('top') ? 'flex-start' : a === 'center' ? 'center' : 'flex-end';
}
// Fade lembut di keempat sisi supaya batas jendela tidak kelihatan (glow dan MilkDrop ikut memudar).
function applyFade() {
  const f = Math.max(0, Math.min(48, S.edgeFade || 0)), v = f + '%';
  const img = f > 0
    ? `linear-gradient(to right,transparent 0,#000 ${v},#000 calc(100% - ${v}),transparent 100%),linear-gradient(to bottom,transparent 0,#000 ${v},#000 calc(100% - ${v}),transparent 100%)`
    : 'none';
  fadeEl.style.webkitMaskImage = img; fadeEl.style.maskImage = img;
  fadeEl.style.webkitMaskComposite = 'source-in'; fadeEl.style.maskComposite = 'intersect';
}
function applyText() { $('#hintText').textContent = i18n(S.lang, 'hint'); $('#done').textContent = i18n(S.lang, 'done'); }
function setEdit(v) { edit = !!v; document.body.classList.toggle('edit', edit); }

api.onSettings((s) => { const prev = S.milkdropPreset; S = s; layout(); applyFade(); applyText(); if (vis && prev !== S.milkdropPreset) loadMd(S.milkdropPreset); });
api.onEdit(setEdit);
api.onNextPreset(() => loadMd('', 2.5));

/* ---------- edit mode: drag, wheel, done ---------- */
let drag = null;
frameEl.addEventListener('pointerdown', (e) => { if (!edit || e.target.closest('#hint')) return; drag = { x: e.screenX, y: e.screenY }; frameEl.setPointerCapture(e.pointerId); });
frameEl.addEventListener('pointermove', (e) => { if (!drag) return; api.drag(e.screenX - drag.x, e.screenY - drag.y); drag = { x: e.screenX, y: e.screenY }; });
frameEl.addEventListener('pointerup', () => { if (drag) { drag = null; api.dragEnd(); } });
frameEl.addEventListener('dblclick', (e) => { if (!e.target.closest('#hint')) api.toggleEdit(); });
$('#done').addEventListener('click', () => api.toggleEdit());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && edit) api.toggleEdit(); });
addEventListener('wheel', (e) => { if (edit) api.resizeBy(e.deltaY < 0 ? 1.06 : 0.94); }, { passive: true });

/* ---------- render loop ---------- */
function frame(now) {
  requestAnimationFrame(frame);
  if (!S.mode) return;
  const dt = (now - last) / 1000;
  if (dt < 1 / (S.fps || 60) - 0.003) return;
  last = now; const t = (now - t0) / 1000;
  if (ac && ac.state === 'suspended') ac.resume();
  if (analyser) { analyser.smoothingTimeConstant = S.smoothing; analyser.getByteFrequencyData(F); analyser.getByteTimeDomainData(T); }

  const avg = (a, b) => { let s = 0; for (let i = a; i < b; i++) s += F[i]; return s / (b - a) / 255; };
  const sens = S.sensitivity;
  const d = { T, bass: Math.min(1, avg(1, 7) * sens), mid: Math.min(1, avg(7, 60) * sens), treb: Math.min(1, avg(60, 250) * sens * 1.6), beat: false };
  bassAvg += (d.bass - bassAvg) * Math.min(1, dt * 1.5);
  if (d.bass > 0.28 && d.bass > bassAvg * 1.35 && t - lastBeat > 0.22) { d.beat = true; lastBeat = t; }

  silentFor = avg(0, 300) < 0.01 ? silentFor + dt : 0;
  const target = S.autoHide && silentFor > 3 ? 0 : 1;
  fade += (target - fade) * Math.min(1, dt * 3);

  const W = stage.clientWidth, H = stage.clientHeight;
  const rot = (S.rotation || 0) + t * (S.spin || 0), pulse = 1 + d.bass * (S.pulse || 0);
  setStyle('transform', `rotate(${rot}deg) scale(${(S.flipH ? -1 : 1) * pulse},${(S.flipV ? -1 : 1) * pulse})`);
  setStyle('filter', `${S.glow > 0 ? `drop-shadow(0 0 ${S.glow}px ${S.colorA})` : ''} ${S.blur > 0 ? `blur(${S.blur}px)` : ''}`.trim() || 'none');
  setStyle('opacity', String((S.opacity * fade).toFixed(3)));

  if (S.mode === 'milkdrop') {
    cv.style.display = 'none'; mdCv.style.display = 'block';
    ensureMilkdrop(W, H);
    if (vis) { mdTimer += dt; if (S.milkdropCycle > 0 && mdTimer > S.milkdropCycle) loadMd('', 2.7); vis.render(); }
    return;
  }
  mdCv.style.display = 'none'; cv.style.display = 'block';
  const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  if (S.trails > 0) { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = `rgba(0,0,0,${1 - S.trails})`; ctx.fillRect(0, 0, cw, ch); ctx.globalCompositeOperation = 'source-over'; }
  else ctx.clearRect(0, 0, cw, ch);
  d.B = Viz.bands(F, COUNTS[S.mode] || S.bars, sens);
  const fn = Viz.modes[S.mode] || Viz.modes.bars;
  ctx.save(); ctx.scale(dpr, dpr);
  fn(ctx, W, H, d, S, t, Math.min(dt, 0.1));
  ctx.restore();
}
(async () => { S = await api.getSettings(); layout(); applyFade(); applyText(); setEdit(await api.getEdit()); requestAnimationFrame(frame); })();
