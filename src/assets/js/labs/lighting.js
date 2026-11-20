import { initLab, h, slider, rafThrottle, missionPanel, clear, resultGrid } from './_lab.js';
import { keyFillRatio, lookName } from './lib2.js';

const PRESETS = {
  rembrandt: ['Rembrandt', { az: 45, el: 35, key: 0.9, fill: 0.3, rim: 0.3, bgl: 0.25 }],
  loop: ['Loop', { az: 30, el: 25, key: 0.9, fill: 0.4, rim: 0.3, bgl: 0.3 }],
  butterfly: ['Butterfly (beauty)', { az: 0, el: 45, key: 0.85, fill: 0.45, rim: 0.2, bgl: 0.4 }],
  split: ['Split', { az: 90, el: 5, key: 0.9, fill: 0.08, rim: 0.4, bgl: 0.1 }],
  highkey: ['High-key commercial', { az: 20, el: 25, key: 0.8, fill: 0.75, rim: 0.3, bgl: 1 }],
  noir: ['Film noir', { az: 70, el: 40, key: 1, fill: 0.05, rim: 0.6, bgl: 0.05 }],
};

const root = initLab('lighting');
if (root) {
  const S = 420;
  const cv = h('canvas', { width: S, height: S, role: 'img', 'aria-label': 'Head lit by key, fill, rim and background lights' });
  const top = h('canvas', { width: 220, height: 220, role: 'img', 'aria-label': 'Top-down lighting diagram' });
  const ctx = cv.getContext('2d');
  const st = { ...PRESETS.loop[1] };
  const info = h('div');
  const ratio = () => keyFillRatio(st.key, st.fill);

  const render = rafThrottle(() => {
    const img = ctx.createImageData(S, S); const d = img.data;
    const az = (st.az * Math.PI) / 180, el = (st.el * Math.PI) / 180;
    const key = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    const fillDir = [-Math.sign(st.az || 1) * 0.5, 0.1, 0.86];
    const rimDir = [Math.sign(st.az || 1) * -0.4, 0.3, -0.87];
    const skin = [0.86, 0.6, 0.47];
    const R = S * 0.33, cx = S / 2, cy = S * 0.47;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const nx = (x - cx) / R, ny = -(y - cy) / (R * 1.18);
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) { // background: lit by the background light, with a soft pool
        const pool = Math.exp(-(((x - S * 0.6) ** 2) + ((y - S * 0.35) ** 2)) / (2 * (S * 0.35) ** 2));
        const v = 0.04 + st.bgl * (0.25 + 0.6 * pool);
        d[i] = 255 * Math.pow(v * 0.95, 1 / 2.2); d[i + 1] = 255 * Math.pow(v * 0.97, 1 / 2.2); d[i + 2] = 255 * Math.pow(v, 1 / 2.2); d[i + 3] = 255; continue;
      }
      const nz = Math.sqrt(1 - r2);
      const n = [nx, ny, nz];
      const dot = (a) => a[0] * n[0] + a[1] * n[1] + a[2] * n[2];
      const kd = Math.max(0, (dot(key) + 0.15) / 1.15) * st.key;
      const fd = Math.max(0, (dot(fillDir) + 0.6) / 1.6) * st.fill;
      const rim = Math.pow(1 - nz, 2.5) * Math.max(0, dot(rimDir) + 0.5) * st.rim * 1.6;
      const spec = Math.pow(Math.max(0, dot([(key[0]) / 2, (key[1]) / 2, (key[2] + 1) / 2])), 40) * st.key * 0.25;
      const L = kd + fd + 0.02;
      for (let c = 0; c < 3; c++) d[i + c] = 255 * Math.pow(Math.min(1, skin[c] * L + rim * 0.9 + spec), 1 / 2.2);
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // eyes & shoulders for scale
    ctx.fillStyle = 'rgba(20,10,8,.85)'; ctx.beginPath(); ctx.ellipse(cx - R * 0.35, cy - R * 0.05, 7, 4.5, 0, 0, Math.PI * 2); ctx.ellipse(cx + R * 0.35, cy - R * 0.05, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.ellipse(cx, S * 1.08, S * 0.42, S * 0.25, 0, Math.PI, 0); ctx.fill();
    // top-down diagram
    const t = top.getContext('2d'); t.fillStyle = '#0b0b12'; t.fillRect(0, 0, 220, 220);
    t.fillStyle = '#d79b77'; t.beginPath(); t.arc(110, 90, 18, 0, Math.PI * 2); t.fill();
    t.fillStyle = '#ececf4'; t.fillRect(100, 190, 20, 14); t.font = '10px system-ui'; t.fillText('CAMERA', 92, 216);
    const lamp = (a, dist, col, label, inten) => { const x = 110 + Math.sin((a * Math.PI) / 180) * dist, y = 90 + Math.cos((a * Math.PI) / 180) * dist; t.globalAlpha = 0.3 + inten * 0.7; t.fillStyle = col; t.beginPath(); t.arc(x, y, 9, 0, Math.PI * 2); t.fill(); t.globalAlpha = 1; t.fillStyle = '#a3a3bd'; t.fillText(label, x - 10, y - 12); };
    lamp(st.az, 70, '#ffd23f', 'KEY', st.key); lamp(-Math.sign(st.az || 1) * 30, 75, '#00e0ff', 'FILL', st.fill); lamp(180 - Math.sign(st.az || 1) * 25, 60, '#ff3d7f', 'RIM', st.rim);
    const r = ratio();
    clear(info).append(resultGrid([['Key : fill ratio', Number.isFinite(r) ? `${r.toFixed(1)} : 1` : '∞'], ['Contrast', Number.isFinite(r) ? `${Math.log2(r).toFixed(1)} stops` : '∞'], ['Look', lookName(r)]]));
    missions.check();
  });
  const sl = {
    az: slider({ label: 'Key angle', min: -120, max: 120, value: st.az, fmt: (v) => `${v}°`, onInput: (v) => { st.az = v; render(); } }),
    el: slider({ label: 'Key height', min: -10, max: 70, value: st.el, fmt: (v) => `${v}°`, onInput: (v) => { st.el = v; render(); } }),
    key: slider({ label: 'Key power', min: 0, max: 1, step: 0.01, value: st.key, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.key = v; render(); } }),
    fill: slider({ label: 'Fill power', min: 0.01, max: 1, step: 0.01, value: st.fill, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.fill = v; render(); } }),
    rim: slider({ label: 'Rim / back', min: 0, max: 1, step: 0.01, value: st.rim, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.rim = v; render(); } }),
    bgl: slider({ label: 'Background', min: 0, max: 1, step: 0.01, value: st.bgl, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.bgl = v; render(); } }),
  };
  const apply = (p) => { Object.assign(st, p); for (const k of Object.keys(sl)) sl[k].set(st[k]); render(); };
  const presets = h('div', { class: 'chips', role: 'group', 'aria-label': 'Lighting presets' }, Object.values(PRESETS).map(([n, p]) => h('button', { class: 'chip', type: 'button', on: { click: () => apply(p) } }, n)));
  const missions = missionPanel([
    { title: 'Classic 4:1 drama', hint: 'Key 30–60° to the side and above eye level, key:fill between 3.5:1 and 4.5:1, and some rim light for separation.', test: () => Math.abs(st.az) >= 30 && Math.abs(st.az) <= 60 && st.el >= 15 && ratio() >= 3.5 && ratio() <= 4.5 && st.rim >= 0.2 },
    { title: 'Bright commercial high-key', hint: 'Key:fill 2:1 or softer, background at 70% or more.', test: () => ratio() <= 2 && st.bgl >= 0.7 && st.key >= 0.5 },
    { title: 'Noir split light', hint: 'Key at 80–100° (side), ratio 8:1 or harder, background at 15% or less.', test: () => Math.abs(st.az) >= 80 && Math.abs(st.az) <= 100 && ratio() >= 8 && st.bgl <= 0.15 },
  ], { heading: 'Missions: light like a DP' });
  root.append(presets, h('div', { class: 'lab-grid-2' }, h('div', { class: 'canvas-wrap center' }, cv),
    h('div', { class: 'lab-controls' }, h('div', { class: 'center' }, top), sl.az.row, sl.el.row, sl.key.row, sl.fill.row, sl.rim.row, sl.bgl.row, info)), missions.el);
  render();
}
