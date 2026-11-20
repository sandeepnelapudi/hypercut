import { initLab, h, slider, rafThrottle, missionPanel, toast } from './_lab.js';
import { wbGains, estimateKelvin } from './lib2.js';
import { paintScene } from '../core/ui.js';

const LIGHTS = [['Candle', 1900], ['Household bulb', 2700], ['Tungsten film light', 3200], ['Fluorescent', 4000], ['Noon daylight', 5600], ['Overcast', 6500], ['Shade', 7500], ['Blue hour', 9500]];

const root = initLab('white-balance');
if (root) {
  const W = 720, H = 405;
  const base = document.createElement('canvas'); const bctx = base.getContext('2d', { willReadFrequently: true });
  paintScene(bctx, W, H);
  bctx.fillStyle = '#7f7f7f'; bctx.fillRect(W * 0.08, H * 0.08, 110, 80);
  bctx.fillStyle = '#fff'; bctx.font = '600 12px system-ui'; bctx.fillText('18% GREY CARD', W * 0.08 + 8, H * 0.08 + 46);
  const src = bctx.getImageData(0, 0, W, H);
  const cv = h('canvas', { width: W, height: H, role: 'img', 'aria-label': 'Scene under the chosen light with your white balance. Click a grey area to auto-balance.' });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const st = { light: 3200, wb: 5600, tint: 0, mystery: false, eyedropped: false };
  const status = h('p', { class: 'key-display', role: 'status', 'aria-live': 'polite' });

  const render = rafThrottle(() => {
    const g = wbGains(st.light, st.wb, st.tint);
    const out = ctx.createImageData(W, H); const s = src.data, d = out.data;
    for (let i = 0; i < s.length; i += 4) {
      for (let c = 0; c < 3; c++) d[i + c] = 255 * Math.pow(Math.pow(s[i + c] / 255, 2.2) * g[c], 1 / 2.2);
      d[i + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    const diff = st.wb - st.light;
    const lightTxt = st.mystery ? 'Mystery light' : `${LIGHTS.find((l) => l[1] === st.light)?.[0] || 'Light'} (${st.light}K)`;
    status.textContent = `${lightTxt} · Camera WB ${st.wb}K · ` + (Math.abs(diff) <= 250 && Math.abs(st.tint) < 0.15 ? 'Neutral ✓' : diff > 0 ? 'Image looks too warm/orange' : 'Image looks too cool/blue');
    missions.check();
  });
  const wb = slider({ label: 'Camera WB', min: 1800, max: 10000, step: 50, value: st.wb, fmt: (v) => `${v}K`, onInput: (v) => { st.wb = v; render(); } });
  const tint = slider({ label: 'Tint (G↔M)', min: -1, max: 1, step: 0.05, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { st.tint = v; render(); } });
  const lightBtns = h('div', { class: 'chips', role: 'group', 'aria-label': 'Light source' }, LIGHTS.map(([n, k]) => h('button', { class: 'chip', type: 'button', on: { click: () => { st.light = k; st.mystery = false; render(); } } }, `${n} ${k}K`)));
  cv.addEventListener('click', (e) => {
    const r = cv.getBoundingClientRect(); const x = Math.floor(((e.clientX - r.left) / r.width) * W), y = Math.floor(((e.clientY - r.top) / r.height) * H);
    const p = ctx.getImageData(x, y, 1, 1).data;
    const sp = src.data.slice((y * W + x) * 4, (y * W + x) * 4 + 3);
    if (Math.max(...sp) - Math.min(...sp) > 30) { toast('Pick something neutral, like the grey card, a white wall or the grey strip.', 'err'); return; }
    const lin = [p[0], p[1], p[2]].map((v) => Math.pow(Math.max(1, v) / 255, 2.2) * 255); // undo display gamma
    const k = Math.round(estimateKelvin(lin, st.wb) / 50) * 50;
    st.wb = k; st.tint = 0; st.eyedropped = true; wb.set(k); tint.set(0); render(); toast(`White balance set to ${k}K from your sample`);
  });
  const newMystery = () => { const pool = LIGHTS.filter(([, k]) => Math.abs(k - 5600) > 900 && k !== st.light); st.light = pool[Math.floor(Math.random() * pool.length)][1]; st.mystery = true; st.wb = 5600; st.eyedropped = false; wb.set(5600); render(); };
  const missions = missionPanel([
    { title: 'Fix the classic mistake', hint: 'Tungsten light, but the camera is still on daylight (5600K), so everything is orange. Balance it by eye with the slider.', setup: () => { st.light = 3200; st.mystery = false; st.wb = 5600; wb.set(5600); render(); }, test: () => st.light === 3200 && !st.mystery && Math.abs(st.wb - 3200) <= 250 },
    { title: 'Solve a mystery light by eye', hint: 'Press "Set up" for a random light, then neutralise it without the eyedropper (within 250K).', setup: newMystery, test: () => st.mystery && !st.eyedropped && Math.abs(st.wb - st.light) <= 250 },
    { title: 'Use the grey card like a pro', hint: 'Get another mystery light, then click the 18% grey card to balance it instantly.', setup: newMystery, test: () => st.mystery && st.eyedropped && Math.abs(st.wb - st.light) <= 250 },
  ], { heading: 'Missions: white balance' });
  root.append(lightBtns, h('div', { class: 'lab-grid-2' }, h('div', {}, h('div', { class: 'canvas-wrap' }, cv), status),
    h('div', { class: 'lab-controls' }, wb.row, tint.row, h('p', { class: 'muted small' }, 'Tip: click the grey card, the white or grey strip, or any neutral area to auto-balance. This is exactly what the white-balance picker does in Resolve, Premiere and your camera.'))), missions.el);
  render();
}
