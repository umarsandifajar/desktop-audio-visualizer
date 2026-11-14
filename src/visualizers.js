// Model visualizer 2D. Tiap fungsi: (ctx, w, h, d, s, t, dt)
// d = { B: bands 0..1, T: time-domain bytes, bass, mid, treb }, s = settings, t = detik, dt = delta detik
const Viz = (() => {
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const col = (s, t, i) => (s.rainbow ? `hsl(${(t * s.hueSpeed + i * 360) % 360},90%,60%)` : mix(s.colorA, s.colorB, Math.min(1, Math.max(0, i))));
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, Math.max(0.5, w), Math.max(0.5, h), r); c.fill(); };

  function bands(F, n, sens) {
    const max = Math.min(F.length, 420), out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.floor(Math.pow(i / n, 1.9) * max) + 1;
      const b = Math.max(a + 1, Math.floor(Math.pow((i + 1) / n, 1.9) * max) + 1);
      let sum = 0; for (let k = a; k < b && k < F.length; k++) sum += F[k];
      out[i] = Math.min(1, (sum / (b - a)) / 255 * sens * (0.8 + (i / n) * 0.9));
    }
    return out;
  }

  const modes = {
    bars(c, w, h, d, s, t) {
      const n = d.B.length, bw = w / n, g = bw * s.barGap;
      for (let i = 0; i < n; i++) {
        const bh = Math.max(2, d.B[i] * h * 0.95);
        c.fillStyle = col(s, t, i / n); rr(c, i * bw + g / 2, h - bh, bw - g, bh, Math.min(6, (bw - g) / 2));
      }
    },
    mirror(c, w, h, d, s, t) {
      const n = d.B.length, bw = w / n, g = bw * s.barGap;
      for (let i = 0; i < n; i++) {
        const bh = Math.max(2, d.B[i] * h * 0.95);
        c.fillStyle = col(s, t, i / n); rr(c, i * bw + g / 2, (h - bh) / 2, bw - g, bh, Math.min(6, (bw - g) / 2));
      }
    },
    radial(c, w, h, d, s, t) {
      const n = d.B.length, cx = w / 2, cy = h / 2, m = Math.min(w, h), r = m * 0.2 * (1 + d.bass * 0.25);
      c.lineCap = 'round'; c.lineWidth = Math.max(2, ((2 * Math.PI * r) / n) * (1 - s.barGap) * 0.9);
      for (let i = 0; i < n; i++) {
        const idx = Math.min(n - 1, (i < n / 2 ? i : n - 1 - i) * 2), v = d.B[idx];
        const a = (i / n) * Math.PI * 2 - Math.PI / 2, co = Math.cos(a), si = Math.sin(a), len = Math.max(2, v * m * 0.28);
        c.strokeStyle = col(s, t, i / n); c.beginPath();
        c.moveTo(cx + co * r, cy + si * r); c.lineTo(cx + co * (r + len), cy + si * (r + len)); c.stroke();
      }
      c.globalAlpha = 0.35; c.strokeStyle = col(s, t, 0.5); c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, r * 0.92, 0, 7); c.stroke(); c.globalAlpha = 1;
    },
    wave(c, w, h, d, s, t) {
      const T = d.T, n = T.length, step = Math.max(1, Math.floor(n / (w / 2)));
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, col(s, t, 0)); g.addColorStop(0.5, col(s, t, 0.5)); g.addColorStop(1, col(s, t, 1));
      c.strokeStyle = g; c.lineWidth = Math.max(2, h * 0.014); c.lineJoin = 'round'; c.beginPath();
      for (let i = 0; i < n; i += step) {
        const v = ((T[i] - 128) / 128) * s.sensitivity * 0.5, x = (i / n) * w, y = h / 2 + v * h * 0.9;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    },
    scope(c, w, h, d, s, t) {
      const T = d.T, n = T.length, m = Math.min(w, h) * 0.45, off = Math.floor(n / 4);
      c.lineWidth = Math.max(1.5, m * 0.012); c.strokeStyle = col(s, t, 0.3 + d.bass * 0.5); c.beginPath();
      for (let i = 0; i < n; i += 2) {
        const x = w / 2 + ((T[i] - 128) / 128) * m * s.sensitivity, y = h / 2 + ((T[(i + off) % n] - 128) / 128) * m * s.sensitivity;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    },
    particles: (() => {
      const P = [];
      return (c, w, h, d, s, t, dt) => {
        const emit = Math.floor(d.bass * 8 * s.sensitivity) + (d.treb > 0.3 ? 2 : 0), sc = Math.min(w, h) / 260;
        for (let i = 0; i < emit && P.length < 700; i++) {
          const a = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * (2 + d.bass * 6);
          P.push({ x: w / 2 + (Math.random() - 0.5) * w * 0.5, y: h * 0.7, vx: Math.cos(a) * sp * 0.5 * sc, vy: (-Math.abs(Math.sin(a)) * sp - 1) * sc, l: 1, r: 1.5 + Math.random() * 3 + d.bass * 3, h: Math.random() });
        }
        for (let i = P.length - 1; i >= 0; i--) {
          const p = P[i]; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.vy += 0.02 * sc * dt * 60; p.l -= dt * 0.6;
          if (p.l <= 0) { P.splice(i, 1); continue; }
          c.globalAlpha = p.l; c.fillStyle = col(s, t, p.h); c.beginPath(); c.arc(p.x, p.y, p.r * sc, 0, 7); c.fill();
        }
        c.globalAlpha = 1;
      };
    })(),
    orb(c, w, h, d, s, t) {
      const n = d.B.length, cx = w / 2, cy = h / 2, m = Math.min(w, h) * 0.5, base = m * 0.45 * (1 + d.bass * 0.18), pts = 140;
      c.beginPath();
      for (let i = 0; i <= pts; i++) {
        const u = i / pts, a = u * Math.PI * 2 - Math.PI / 2, sym = u < 0.5 ? u * 2 : (1 - u) * 2;
        const v = d.B[Math.min(n - 1, Math.floor(sym * n * 0.7))];
        const r = base * (0.75 + v * 0.55) + Math.sin(a * 3 + t * 2) * m * 0.02;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
      const g = c.createRadialGradient(cx, cy, base * 0.1, cx, cy, base * 1.4);
      g.addColorStop(0, col(s, t, 0)); g.addColorStop(1, col(s, t, 1)); c.fillStyle = g; c.fill();
    },
    spectrogram: (() => {
      let sg = null; const W = 300;
      return (c, w, h, d, s, t) => {
        const rows = d.B.length;
        if (!sg || sg.height !== rows) { sg = document.createElement('canvas'); sg.width = W; sg.height = rows; }
        const x = sg.getContext('2d'); x.globalCompositeOperation = 'copy'; x.drawImage(sg, -1, 0); x.globalCompositeOperation = 'source-over';
        x.clearRect(W - 1, 0, 1, rows);
        for (let r = 0; r < rows; r++) {
          const v = d.B[r]; x.globalAlpha = Math.min(1, v * 1.6);
          x.fillStyle = s.rainbow ? `hsl(${240 - 240 * v + t * s.hueSpeed},90%,55%)` : mix(s.colorA, s.colorB, v);
          x.fillRect(W - 1, rows - 1 - r, 1, 1);
        }
        x.globalAlpha = 1; c.imageSmoothingEnabled = true; c.drawImage(sg, 0, 0, w, h);
      };
    })(),
  };
  return { modes, bands, col, mix };
})();
