// Model tambahan. d.beat = true pada frame saat ada hentakan bass.
(() => {
  const { col } = Viz;
  Object.assign(Viz.modes, {
    tunnel: (() => {
      let off = 0;
      return (c, w, h, d, s, t, dt) => {
        off = (off + dt * (0.12 + d.bass * 0.9)) % 1;
        const n = d.B.length, cx = w / 2, cy = h / 2, N = 16; c.lineJoin = 'round';
        for (let k = 0; k < N; k++) {
          const p = (k / N + off) % 1, rr = Math.pow(p, 2.2) * 0.78;
          c.globalAlpha = Math.min(1, p * 6) * (1 - p * 0.45); c.lineWidth = 1 + p * 5; c.strokeStyle = col(s, t, p); c.beginPath();
          for (let i = 0; i <= n; i++) {
            const a = (i / n) * Math.PI * 2 + p * 1.2 + t * 0.15, v = d.B[Math.min(n - 1, i < n / 2 ? i : n - i)];
            const r = rr * (1 + v * 0.4 * (1 - p));
            const x = cx + Math.cos(a) * r * w, y = cy + Math.sin(a) * r * h; i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke();
        }
        c.globalAlpha = 1;
      };
    })(),
    starfield: (() => {
      const S = []; for (let i = 0; i < 260; i++) S.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), h: Math.random() });
      return (c, w, h, d, s, t, dt) => {
        const sp = (0.1 + d.bass * 1.1 + (d.beat ? 0.35 : 0)) * dt, cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 260; c.lineCap = 'round';
        for (const p of S) {
          const pz = p.z; p.z -= sp;
          if (p.z <= 0.02) { p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; p.z = 1; p.h = Math.random(); continue; }
          const x0 = cx + (p.x / pz) * w * 0.1, y0 = cy + (p.y / pz) * h * 0.25, x1 = cx + (p.x / p.z) * w * 0.1, y1 = cy + (p.y / p.z) * h * 0.25;
          if (x1 < 0 || x1 > w || y1 < 0 || y1 > h) { p.z = 1; continue; }
          c.globalAlpha = Math.min(1, 1.2 - p.z); c.lineWidth = (1 - p.z) * 3 * sc + 0.6; c.strokeStyle = col(s, t, p.h);
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        }
        c.globalAlpha = 1;
      };
    })(),
    rings: (() => {
      const R = [];
      return (c, w, h, d, s, t, dt) => {
        if (d.beat || (R.length === 0 && d.bass > 0.2)) R.push({ p: 0, h: Math.random() });
        const cx = w / 2, cy = h / 2, n = d.B.length, m = Math.min(w, h);
        for (let i = R.length - 1; i >= 0; i--) {
          const q = R[i]; q.p += dt * 0.55; if (q.p >= 1) { R.splice(i, 1); continue; }
          c.globalAlpha = 1 - q.p; c.lineWidth = 2 + (1 - q.p) * 7; c.strokeStyle = col(s, t, q.h);
          c.beginPath(); c.ellipse(cx, cy, q.p * w * 0.5, q.p * h * 0.5, 0, 0, 7); c.stroke();
        }
        c.globalAlpha = 1; const r0 = m * 0.14 * (1 + d.bass * 0.3);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + t * 0.3, v = d.B[i], r = r0 + v * m * 0.12;
          c.fillStyle = col(s, t, i / n); c.beginPath(); c.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5 + v * m * 0.035, 0, 7); c.fill();
        }
      };
    })(),
    ridge: (() => {
      const H = []; let acc = 0;
      return (c, w, h, d, s, t, dt) => {
        acc += dt; if (acc > 0.07) { acc = 0; H.unshift(Float32Array.from(d.B)); if (H.length > 16) H.pop(); }
        c.lineJoin = 'round';
        for (let j = H.length - 1; j >= 0; j--) {
          const B = H[j], n = B.length, k = j / 16, y0 = h * 0.3 + (1 - k) * h * 0.62;
          c.globalAlpha = 1 - k * 0.75; c.lineWidth = Math.max(1.2, h * 0.006); c.strokeStyle = col(s, t, k); c.beginPath();
          for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * w, win = Math.sin((Math.PI * i) / (n - 1)), y = y0 - B[i] * h * 0.38 * win * (1 - k * 0.3);
            i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke();
        }
        c.globalAlpha = 1;
      };
    })(),
    led: (() => {
      let peaks = [];
      return (c, w, h, d, s, t, dt) => {
        const cols = d.B.length, cw = w / cols, rows = Math.max(4, Math.floor(h / cw)), chh = h / rows, rad = Math.min(cw, chh) * 0.38 * (1 - s.barGap * 0.4);
        if (peaks.length !== cols) peaks = new Array(cols).fill(0);
        for (let i = 0; i < cols; i++) {
          const lit = Math.round(d.B[i] * rows); peaks[i] = Math.max(lit, peaks[i] - dt * 6);
          for (let r = 0; r < rows; r++) {
            const on = r < lit, pk = Math.round(peaks[i]) === r + 1;
            c.globalAlpha = on ? 1 : pk ? 0.9 : 0.07; c.fillStyle = col(s, t, r / rows);
            c.beginPath(); c.arc(i * cw + cw / 2, h - r * chh - chh / 2, rad, 0, 7); c.fill();
          }
        }
        c.globalAlpha = 1;
      };
    })(),
    aurora(c, w, h, d, s, t) {
      const L = 5, n = d.B.length; c.globalCompositeOperation = 'lighter';
      for (let l = 0; l < L; l++) {
        const e = d.B[Math.floor((l / L) * n * 0.8)] || 0, base = h * (0.35 + l * 0.07), amp = h * (0.06 + e * 0.3), f = ((1.2 + l * 0.5) * Math.PI * 2) / w;
        const g = c.createLinearGradient(0, base - amp, 0, h); g.addColorStop(0, col(s, t, l / (L - 1))); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(0, h);
        for (let x = 0; x <= w; x += Math.max(4, w / 160)) c.lineTo(x, base + Math.sin(x * f + t * (0.6 + l * 0.25) + l * 1.7) * amp + Math.sin(x * f * 2.3 - t * 0.9) * amp * 0.35);
        c.lineTo(w, h); c.closePath(); c.fill();
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    },
    kaleido(c, w, h, d, s, t) {
      const n = d.B.length, K = 8, m = Math.min(w, h) * 0.5;
      c.save(); c.translate(w / 2, h / 2); c.rotate(t * 0.15 + d.bass * 0.2);
      for (let k = 0; k < K; k++) for (const f of [1, -1]) {
        c.save(); c.rotate((k * 2 * Math.PI) / K); c.scale(1, f); c.beginPath(); c.moveTo(0, 0);
        for (let i = 0; i < n; i++) { const a = (i / (n - 1)) * (Math.PI / K), r = m * (0.1 + d.B[i] * 0.9 * (0.35 + (i / n) * 0.65)); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.closePath(); c.globalAlpha = 0.28; c.fillStyle = col(s, t, k / K); c.fill();
        c.globalAlpha = 0.9; c.lineWidth = 1.5; c.strokeStyle = col(s, t, (k / K + 0.15) % 1); c.stroke(); c.restore();
      }
      c.restore(); c.globalAlpha = 1;
    },
    helix(c, w, h, d, s, t) {
      const n = d.B.length, amp = h * 0.38 * (0.5 + d.bass * 0.6), cy = h / 2;
      for (let i = 0; i < n; i++) {
        const x = ((i + 0.5) / n) * w, ph = i * 0.35 - t * 2.2, sn = Math.sin(ph), z = Math.cos(ph), v = d.B[i];
        c.globalAlpha = 0.25 + 0.25 * Math.abs(z); c.strokeStyle = col(s, t, i / n); c.lineWidth = Math.max(1, (w / n) * 0.12);
        c.beginPath(); c.moveTo(x, cy + sn * amp); c.lineTo(x, cy - sn * amp); c.stroke(); c.globalAlpha = 1;
        const r = Math.max(2, (w / n) * 0.35 * (0.5 + v * 1.2)); c.fillStyle = col(s, t, i / n);
        c.beginPath(); c.arc(x, cy + sn * amp, r * (0.8 + 0.2 * z), 0, 7); c.fill();
        c.beginPath(); c.arc(x, cy - sn * amp, r * (0.8 - 0.2 * z), 0, 7); c.fill();
      }
    },
    fireworks: (() => {
      const P = [];
      return (c, w, h, d, s, t, dt) => {
        const m = Math.min(w, h);
        if (d.beat && P.length < 1500) {
          const cx = w * (0.15 + Math.random() * 0.7), cy = h * (0.15 + Math.random() * 0.4), n = 36 + Math.floor(d.bass * 50), hu = Math.random();
          for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * 0.2, sp = (0.4 + Math.random() * 0.6) * m * (0.6 + d.bass * 0.6); P.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, h: hu }); }
        }
        c.lineWidth = 2; c.lineCap = 'round';
        for (let i = P.length - 1; i >= 0; i--) {
          const p = P[i]; p.vy += m * 0.9 * dt; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt * 0.9;
          if (p.l <= 0) { P.splice(i, 1); continue; }
          c.globalAlpha = p.l; c.strokeStyle = col(s, t, p.h); c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * dt * 2, p.y - p.vy * dt * 2); c.stroke();
        }
        c.globalAlpha = 1;
      };
    })(),
  });
})();
