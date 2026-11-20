import { initLab, h, slider, select, resultGrid, clear } from './_lab.js';
import { prefersReducedMotion } from '../core/ui.js';

const root = initLab('shutter-fps');
if (root) {
  const st = { fps: 24, angle: 180, speed: 900, playing: !prefersReducedMotion() };
  const cv = h('canvas', { width: 900, height: 300, role: 'img', 'aria-label': 'Motion blur simulation' });
  const strip = h('canvas', { width: 900, height: 120, role: 'img', 'aria-label': 'Consecutive frames strip' });
  const info = h('div');
  const ctx = cv.getContext('2d');
  let t0 = performance.now(), lastFrameIdx = -1;

  function exposureText() {
    const exp = (st.angle / 360) / st.fps;
    return `1/${Math.round(1 / exp)} s`;
  }
  function posAt(t) { // seconds → x (ping-pong)
    const span = 900 - 120; const d = (t * st.speed) % (span * 2);
    return 60 + (d < span ? d : span * 2 - d);
  }
  function drawFrame(c, w, hgt, tFrame, yMid, r) {
    const exp = (st.angle / 360) / st.fps;
    const samples = Math.max(1, Math.min(48, Math.round(exp * st.speed / 3)));
    c.globalAlpha = 1 / samples * 1.0;
    for (let s = 0; s < samples; s++) {
      const x = posAt(tFrame + (exp * s) / samples);
      c.fillStyle = '#ff3d7f'; c.beginPath(); c.arc(x, yMid, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffd23f'; c.fillRect(x - r * 0.15, yMid - r * 0.9, r * 0.3, r * 1.8);
    }
    c.globalAlpha = 1;
  }
  function render(now) {
    const t = (now - t0) / 1000;
    const idx = Math.floor(t * st.fps);
    if (idx !== lastFrameIdx || !st.playing) {
      lastFrameIdx = idx;
      ctx.fillStyle = '#0b0b12'; ctx.fillRect(0, 0, 900, 300);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < 900; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke(); }
      drawFrame(ctx, 900, 300, idx / st.fps, 150, 40);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '600 16px system-ui'; ctx.fillText(`${st.fps} fps · ${st.angle}° · ${exposureText()}`, 14, 26);
    }
    if (st.playing) requestAnimationFrame(render);
  }
  function drawStrip() {
    const c = strip.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 900, 120);
    const n = 6; const fw = 900 / n;
    for (let i = 0; i < n; i++) {
      c.save(); c.beginPath(); c.rect(i * fw + 4, 8, fw - 8, 104); c.clip();
      c.fillStyle = '#12121c'; c.fillRect(i * fw + 4, 8, fw - 8, 104);
      c.translate(i * fw + 4, 8); c.scale((fw - 8) / 900, 104 / 300);
      drawFrame(c, 900, 300, 0.4 + i / st.fps, 150, 40);
      c.restore();
      c.fillStyle = '#a3a3bd'; c.font = '11px system-ui'; c.fillText(`F${i + 1}`, i * fw + 10, 22);
    }
  }
  function updateInfo() {
    const exp = (st.angle / 360) / st.fps;
    clear(info).append(resultGrid([['Exposure per frame', exposureText()], ['Frame interval', `${(1000 / st.fps).toFixed(1)} ms`], ['Blur length', `${Math.round(exp * st.speed)} px`], ['Feel', st.angle <= 60 ? 'Staccato, crisp, intense' : st.angle <= 200 ? 'Natural, cinematic' : 'Smeary, dreamy']]));
    drawStrip();
  }
  const fps = select({ label: 'Frame rate', value: '24', options: [['12', '12 fps (stop-motion feel)'], ['24', '24 fps (cinema)'], ['30', '30 fps'], ['48', '48 fps (HFR)'], ['60', '60 fps']], onChange: (v) => { st.fps = Number(v); updateInfo(); if (!st.playing) render(performance.now()); } });
  const ang = slider({ label: 'Shutter angle', min: 11.25, max: 360, step: 11.25, value: 180, fmt: (v) => `${v}°`, onInput: (v) => { st.angle = v; updateInfo(); if (!st.playing) render(performance.now()); } });
  const spd = slider({ label: 'Subject speed', min: 100, max: 2400, step: 50, value: 900, fmt: (v) => `${v}px/s`, onInput: (v) => { st.speed = v; updateInfo(); if (!st.playing) render(performance.now()); } });
  const play = h('button', { class: 'btn btn-sm', type: 'button' }, st.playing ? 'Pause' : 'Play');
  play.addEventListener('click', () => { st.playing = !st.playing; play.textContent = st.playing ? 'Pause' : 'Play'; if (st.playing) { t0 = performance.now(); requestAnimationFrame(render); } });
  const presets = h('div', { class: 'chips' }, [['Cinema 24/180°', 24, 180], ['Action 24/45°', 24, 45], ['Dreamy 24/360°', 24, 360], ['Sports 60/180°', 60, 180]].map(([n, f, a]) => h('button', { class: 'chip', type: 'button', on: { click: () => { st.fps = f; st.angle = a; fps.el.value = String(f); ang.set(a); updateInfo(); render(performance.now()); } } }, n)));
  root.append(h('div', { class: 'ctl-row' }, fps.row, play), presets, h('div', { class: 'canvas-wrap' }, cv), h('div', { class: 'lab-controls' }, ang.row, spd.row), info, h('h2', { class: 'h4' }, 'Six consecutive frames'), h('div', { class: 'canvas-wrap' }, strip));
  updateInfo();
  requestAnimationFrame(render);
}
