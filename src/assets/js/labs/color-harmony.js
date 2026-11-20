import { initLab, h, slider, select, copyText, clear } from './_lab.js';
import { harmony, HARMONIES, hexToRgb, rgbToHsl } from './lib.js';

const root = initLab('color-harmony');
if (root) {
  const state = { h: 25, s: 0.8, l: 0.5, type: 'complementary' };
  const wheel = h('canvas', { width: 260, height: 260, 'aria-hidden': 'true' });
  const frame = h('canvas', { width: 640, height: 360, role: 'img', 'aria-label': 'Palette applied to a sample frame' });
  const sw = h('div', { class: 'swatches' });
  const mood = h('p', { class: 'callout tip' });
  const picker = h('input', { type: 'color', value: '#e6731a', 'aria-label': 'Base color' });

  function drawWheel(cols) {
    const c = wheel.getContext('2d'); const R = 120, cx = 130, cy = 130;
    c.clearRect(0, 0, 260, 260);
    for (let a = 0; a < 360; a += 1) { c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, R, ((a - 90) * Math.PI) / 180, ((a - 89) * Math.PI) / 180); c.fillStyle = `hsl(${a} 85% 55%)`; c.fill(); }
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(128,128,128,1)'); g.addColorStop(1, 'rgba(128,128,128,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
    for (const hex of cols) {
      const [r, gg, b] = hexToRgb(hex); const [hh, ss] = rgbToHsl(r, gg, b);
      const ang = ((hh - 90) * Math.PI) / 180; const rad = R * Math.max(0.15, ss);
      const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke();
      c.fillStyle = hex; c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  }
  function drawFrame(cols) {
    const c = frame.getContext('2d'); const W = 640, H = 360;
    const [bg, a, b2 = cols[0], d = cols[1]] = cols.length >= 3 ? [cols[1], cols[0], cols[2], cols[3] || cols[1]] : [cols[1], cols[0], cols[0], cols[1]];
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, bg); g.addColorStop(1, '#050505');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = 0.35; c.fillStyle = d; c.fillRect(0, H * 0.7, W, H * 0.3); c.globalAlpha = 1;
    c.fillStyle = b2; c.fillRect(W * 0.72, H * 0.2, 60, 160); // practical/prop
    c.fillStyle = a; c.beginPath(); c.ellipse(W * 0.38, H * 0.48, 55, 70, 0, 0, Math.PI * 2); c.fill(); // subject head
    c.beginPath(); c.ellipse(W * 0.38, H * 1.02, 120, 130, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 22px system-ui'; c.fillText(HARMONIES[state.type].name.toUpperCase(), 20, 36);
  }
  function update() {
    const cols = harmony(state.type, state.h, state.s, state.l);
    clear(sw).append(...cols.map((hex) => h('div', { class: 'swatch' }, h('div', { class: 'chipc', style: { background: hex } }), h('button', { type: 'button', title: 'Copy hex', on: { click: () => copyText(hex) } }, hex.toUpperCase()))));
    mood.textContent = HARMONIES[state.type].mood;
    drawWheel(cols); drawFrame(cols);
  }
  const hue = slider({ label: 'Base hue', min: 0, max: 359, value: state.h, fmt: (v) => `${v}°`, onInput: (v) => { state.h = v; update(); } });
  const sat = slider({ label: 'Saturation', min: 0, max: 100, value: state.s * 100, fmt: (v) => `${v}%`, onInput: (v) => { state.s = v / 100; update(); } });
  const lig = slider({ label: 'Lightness', min: 10, max: 90, value: state.l * 100, fmt: (v) => `${v}%`, onInput: (v) => { state.l = v / 100; update(); } });
  const type = select({ label: 'Harmony', value: state.type, options: Object.entries(HARMONIES).map(([k, v]) => [k, v.name]), onChange: (v) => { state.type = v; update(); } });
  picker.addEventListener('input', () => { const rgb = hexToRgb(picker.value); if (!rgb) return; const [hh, ss, ll] = rgbToHsl(...rgb); state.h = Math.round(hh); state.s = ss; state.l = ll; hue.set(state.h); sat.set(Math.round(ss * 100)); lig.set(Math.round(ll * 100)); update(); });
  const presets = h('div', { class: 'chips' }, [['Teal & Orange', 25, 'complementary'], ['Matrix', 120, 'monochromatic'], ['Wes Anderson', 345, 'triadic'], ['Blade Runner', 300, 'split'], ['Sunset nostalgia', 20, 'analogous']].map(([n, hh, t]) => h('button', { class: 'chip', type: 'button', on: { click: () => { state.h = hh; state.type = t; hue.set(hh); type.el.value = t; update(); } } }, n)));
  root.append(
    h('div', { class: 'ctl-row' }, type.row, h('label', {}, 'Pick base ', picker)),
    presets,
    h('div', { class: 'lab-grid-2' },
      h('div', {}, h('div', { class: 'canvas-wrap' }, frame), h('h2', { class: 'h4' }, 'Palette (click to copy)'), sw),
      h('div', { class: 'lab-controls' }, h('div', { class: 'center' }, wheel), hue.row, sat.row, lig.row, mood)),
  );
  update();
}
