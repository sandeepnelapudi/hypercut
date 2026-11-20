import { initLab, h, select, copyText, slider } from './_lab.js';
import { cubicBezier, EASE_PRESETS } from './lib.js';
import { prefersReducedMotion } from '../core/ui.js';

const root = initLab('easing');
if (root) {
  let pts = [...EASE_PRESETS['expo-out']];
  let duration = 0.8;
  const S = 320, PAD = 60; // graph size and padding (y can overshoot)
  const graph = h('canvas', { width: S + PAD * 2, height: S + PAD * 2, role: 'img', 'aria-label': 'Bezier curve editor. Drag the two handles.', tabindex: '0' });
  const speed = h('canvas', { width: S + PAD * 2, height: 120, role: 'img', 'aria-label': 'Speed graph' });
  const stage = h('canvas', { width: 640, height: 120, role: 'img', 'aria-label': 'Animation preview' });
  const code = h('code', {});
  const g = graph.getContext('2d');
  const toPx = (x, y) => [PAD + x * S, PAD + (1 - y) * S];
  const fromPx = (px, py) => [Math.min(1, Math.max(0, (px - PAD) / S)), Math.min(2, Math.max(-1, 1 - (py - PAD) / S))];
  const inputs = [];

  function draw() {
    g.clearRect(0, 0, graph.width, graph.height);
    g.fillStyle = '#0b0b12'; g.fillRect(0, 0, graph.width, graph.height);
    g.strokeStyle = '#2a2a40'; g.strokeRect(PAD, PAD, S, S);
    g.fillStyle = '#a3a3bd'; g.font = '11px system-ui'; g.fillText('time →', PAD + S - 40, PAD + S + 16); g.save(); g.translate(PAD - 10, PAD + 50); g.rotate(-Math.PI / 2); g.fillText('progress →', 0, 0); g.restore();
    const [x1, y1, x2, y2] = pts; const ease = cubicBezier(x1, y1, x2, y2);
    const [ax, ay] = toPx(0, 0), [bx, by] = toPx(1, 1), [c1x, c1y] = toPx(x1, y1), [c2x, c2y] = toPx(x2, y2);
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(c1x, c1y); g.moveTo(bx, by); g.lineTo(c2x, c2y); g.stroke();
    g.strokeStyle = '#ff3d7f'; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, ay); g.bezierCurveTo(c1x, c1y, c2x, c2y, bx, by); g.stroke(); g.lineWidth = 1;
    for (const [x, y, c] of [[c1x, c1y, '#00e0ff'], [c2x, c2y, '#ffd23f']]) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
    // speed graph = derivative of eased progress
    const sc = speed.getContext('2d'); sc.fillStyle = '#0b0b12'; sc.fillRect(0, 0, speed.width, 120);
    const N = 120, vals = []; for (let i = 0; i <= N; i++) vals.push(ease(Math.min(1, (i + 0.5) / N)) - ease(Math.max(0, (i - 0.5) / N)));
    const max = Math.max(...vals.map(Math.abs), 1e-6);
    sc.strokeStyle = '#3ddc97'; sc.beginPath(); vals.forEach((v, i) => { const x = PAD + (i / N) * S, y = 100 - (v / max) * 85; i ? sc.lineTo(x, y) : sc.moveTo(x, y); }); sc.stroke();
    sc.fillStyle = '#a3a3bd'; sc.font = '11px system-ui'; sc.fillText('Speed over time', PAD, 14);
    code.textContent = `cubic-bezier(${pts.map((v) => +v.toFixed(3)).join(', ')})`;
    inputs.forEach((inp, i) => { if (document.activeElement !== inp) inp.value = String(+pts[i].toFixed(3)); });
  }
  let anim = null;
  function play() {
    const c = stage.getContext('2d'); const ease = cubicBezier(...pts); const start = performance.now();
    cancelAnimationFrame(anim);
    const frame = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000)); const p = ease(t);
      c.fillStyle = '#0b0b12'; c.fillRect(0, 0, 640, 120);
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(40, 58, 560, 4);
      const lin = 40 + t * 520; c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(lin, 80, 40, 20);
      const x = 40 + p * 520; c.fillStyle = '#ff3d7f'; c.fillRect(x, 30, 40, 40);
      c.fillStyle = '#a3a3bd'; c.font = '11px system-ui'; c.fillText('eased', 4, 54); c.fillText('linear', 4, 94);
      if (t < 1) anim = requestAnimationFrame(frame);
    };
    anim = requestAnimationFrame(frame);
  }
  // Dragging handles (pointer events) + keyboard nudge
  let drag = -1;
  const local = (e) => { const r = graph.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * graph.width, ((e.clientY - r.top) / r.height) * graph.height]; };
  graph.addEventListener('pointerdown', (e) => {
    const [px, py] = local(e);
    const d1 = Math.hypot(px - toPx(pts[0], pts[1])[0], py - toPx(pts[0], pts[1])[1]);
    const d2 = Math.hypot(px - toPx(pts[2], pts[3])[0], py - toPx(pts[2], pts[3])[1]);
    drag = Math.min(d1, d2) < 30 ? (d1 <= d2 ? 0 : 1) : -1;
    if (drag >= 0) graph.setPointerCapture(e.pointerId);
  });
  graph.addEventListener('pointermove', (e) => { if (drag < 0) return; const [x, y] = fromPx(...local(e)); pts[drag * 2] = x; pts[drag * 2 + 1] = y; draw(); });
  const end = () => { if (drag >= 0) { drag = -1; if (!prefersReducedMotion()) play(); } };
  graph.addEventListener('pointerup', end); graph.addEventListener('pointercancel', end);
  let active = 0;
  graph.addEventListener('keydown', (e) => {
    const st = e.shiftKey ? 0.1 : 0.02; const i = active * 2;
    if (e.key === 'Tab') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); active = 1 - active; return; }
    if (e.key === 'ArrowLeft') pts[i] = Math.max(0, pts[i] - st); else if (e.key === 'ArrowRight') pts[i] = Math.min(1, pts[i] + st);
    else if (e.key === 'ArrowUp') pts[i + 1] = Math.min(2, pts[i + 1] + st); else if (e.key === 'ArrowDown') pts[i + 1] = Math.max(-1, pts[i + 1] - st); else return;
    e.preventDefault(); draw();
  });
  ['x1', 'y1', 'x2', 'y2'].forEach((lbl, i) => {
    const inp = h('input', { type: 'number', step: '0.01', min: i % 2 ? '-1' : '0', max: i % 2 ? '2' : '1', 'aria-label': lbl, value: String(pts[i]) });
    inp.addEventListener('input', () => { const v = Number(inp.value); if (!Number.isFinite(v)) return; pts[i] = i % 2 ? Math.max(-1, Math.min(2, v)) : Math.max(0, Math.min(1, v)); draw(); });
    inputs.push(inp);
  });
  const presetSel = select({ label: 'Preset', value: 'expo-out', options: Object.keys(EASE_PRESETS).map((k) => [k, k]), onChange: (v) => { pts = [...EASE_PRESETS[v]]; draw(); play(); } });
  const dur = slider({ label: 'Duration', min: 0.2, max: 3, step: 0.1, value: duration, fmt: (v) => `${v.toFixed(1)} s`, onInput: (v) => { duration = v; } });
  const playBtn = h('button', { class: 'btn btn-sm', type: 'button', on: { click: play } }, '▶ Play');
  const copyBtn = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => copyText(code.textContent) } }, 'Copy CSS');
  root.append(h('div', { class: 'ctl-row' }, presetSel.row, playBtn, copyBtn),
    h('div', { class: 'lab-grid-2' },
      h('div', {}, h('div', { class: 'canvas-wrap' }, graph), h('div', { class: 'canvas-wrap' }, speed)),
      h('div', { class: 'lab-controls' }, h('p', {}, code), h('div', { class: 'ctl-row' }, ...inputs.map((inp, i) => h('label', {}, ['x1', 'y1', 'x2', 'y2'][i], ' ', inp))), dur.row, h('div', { class: 'canvas-wrap' }, stage),
        h('p', { class: 'muted small' }, 'Keyboard: focus the graph, use the arrow keys to move a handle (Shift for bigger steps), and Space to switch handles. After Effects tip: an ease-out with about 85% incoming influence is close to "expo-out".'))));
  draw(); if (!prefersReducedMotion()) play();
}
