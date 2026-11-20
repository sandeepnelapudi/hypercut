import { initLab, h, slider, clear } from './_lab.js';

const SHOTS = {
  soup: { name: 'A bowl of hot soup', draw(c, W, H) {
    c.fillStyle = '#3b2a1e'; c.fillRect(0, 0, W, H); c.fillStyle = '#5a3d28'; c.fillRect(0, H * 0.6, W, H * 0.4);
    c.fillStyle = '#e9e2d0'; c.beginPath(); c.ellipse(W / 2, H * 0.62, 170, 60, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c96a2b'; c.beginPath(); c.ellipse(W / 2, H * 0.6, 140, 42, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 4; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(W / 2 + i * 50, H * 0.5); c.bezierCurveTo(W / 2 + i * 50 - 25, H * 0.4, W / 2 + i * 50 + 25, H * 0.3, W / 2 + i * 50, H * 0.18); c.stroke(); }
  } },
  funeral: { name: 'A small coffin with white lilies', draw(c, W, H) {
    c.fillStyle = '#1b1d24'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#5b3b26'; c.beginPath(); c.moveTo(W * 0.3, H * 0.62); c.lineTo(W * 0.38, H * 0.5); c.lineTo(W * 0.66, H * 0.5); c.lineTo(W * 0.72, H * 0.62); c.lineTo(W * 0.66, H * 0.74); c.lineTo(W * 0.38, H * 0.74); c.closePath(); c.fill();
    c.fillStyle = '#f4f4ee'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(W * 0.42 + i * 26, H * 0.48, 12, 7, i, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(255,220,150,.15)'; c.beginPath(); c.arc(W * 0.15, H * 0.3, 60, 0, Math.PI * 2); c.fill();
  } },
  child: { name: 'A child laughing with a balloon', draw(c, W, H) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ec5ff'); g.addColorStop(1, '#bfe6a8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * 0.62, H * 0.32); c.lineTo(W * 0.52, H * 0.62); c.stroke();
    c.fillStyle = '#ff3d7f'; c.beginPath(); c.ellipse(W * 0.62, H * 0.2, 36, 44, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f0c4a2'; c.beginPath(); c.arc(W * 0.47, H * 0.6, 40, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#5a2a1a'; c.lineWidth = 4; c.beginPath(); c.arc(W * 0.47, H * 0.62, 20, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = '#3a6fd8'; c.fillRect(W * 0.42, H * 0.7, 52, 60);
  } },
  wall: { name: 'A blank wall (control shot)', draw(c, W, H) { c.fillStyle = '#7a7568'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < H; y += 30) c.fillRect(0, y, W, 2); } },
};
const FEELINGS = ['Hunger', 'Grief', 'Tenderness / joy', 'Boredom', 'Nothing in particular'];

function drawFace(c, W, H) {
  c.fillStyle = '#2b2b30'; c.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.5;
  c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(cx, H * 1.05, 200, 150, 0, Math.PI, 0); c.fill();
  const g = c.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, 130); g.addColorStop(0, '#e7bfa0'); g.addColorStop(1, '#9c6b52');
  c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, 95, 120, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a1d16'; c.beginPath(); c.ellipse(cx, cy - 92, 100, 48, 0, Math.PI, 0); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx - 35, cy - 15, 15, 8, 0, 0, Math.PI * 2); c.ellipse(cx + 35, cy - 15, 15, 8, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2b1a10'; c.beginPath(); c.arc(cx - 33, cy - 14, 6, 0, Math.PI * 2); c.arc(cx + 37, cy - 14, 6, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#4a2a1e'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 52, cy - 36); c.lineTo(cx - 18, cy - 34); c.moveTo(cx + 18, cy - 34); c.lineTo(cx + 52, cy - 36); c.stroke();
  c.beginPath(); c.moveTo(cx - 25, cy + 52); c.lineTo(cx + 25, cy + 52); c.stroke();
  c.strokeStyle = '#8a5a44'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx - 8, cy + 25); c.lineTo(cx + 6, cy + 27); c.stroke();
}
function grain(c, W, H) { const img = c.getImageData(0, 0, W, H); for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 22; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; } c.putImageData(img, 0, 0); }

const root = initLab('kuleshov');
if (root) {
  const W = 640, H = 360;
  const cv = h('canvas', { width: W, height: H, role: 'img', 'aria-label': 'Kuleshov experiment playback' });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const caption = h('p', { class: 'center muted', role: 'status', 'aria-live': 'polite' });
  const answers = {};
  let hold = 2;
  let timer = null;
  const ask = h('div');
  const results = h('div');

  function show(kind) {
    if (kind === 'face') { drawFace(ctx, W, H); caption.textContent = 'Shot A: the man'; } else { SHOTS[kind].draw(ctx, W, H); caption.textContent = `Shot B: ${SHOTS[kind].name}`; }
    grain(ctx, W, H);
  }
  function play(kind) {
    clearTimeout(timer);
    clear(ask);
    const seq = [['face', hold], [kind, 2], ['face', hold + 0.5]];
    let i = 0;
    const step = () => {
      if (i >= seq.length) { caption.textContent = 'What was the man feeling?'; renderQuestion(kind); return; }
      show(seq[i][0]); timer = setTimeout(step, seq[i][1] * 1000); i++;
    };
    step();
  }
  function renderQuestion(kind) {
    clear(ask).append(h('div', { class: 'answers' }, FEELINGS.map((f) => h('button', { class: 'btn btn-ghost', type: 'button', on: { click: () => { answers[kind] = f; clear(ask); renderResults(); } } }, f))));
  }
  function renderResults() {
    const done = Object.keys(answers);
    clear(results).append(
      h('table', { class: 'data-table' }, h('thead', {}, h('tr', {}, h('th', {}, 'Shot B'), h('th', {}, 'You read the face as'))), h('tbody', {}, done.map((k) => h('tr', {}, h('td', {}, SHOTS[k].name), h('td', {}, answers[k]))))),
      done.length >= 3 ? h('div', { class: 'callout tip' }, h('strong', {}, 'The reveal: '), 'The face was the exact same drawing every time. Not one pixel changed. Your brain filled in the emotion from the shot in between. That is the Kuleshov effect, and it is why reaction shots, cutaways and the order of shots matter so much. ',
        new Set(done.map((k) => answers[k])).size > 1 ? 'You gave different answers, so you just felt it yourself.' : 'You gave the same answer every time, which is unusual. Try it on a friend without telling them the trick.') : h('p', { class: 'muted small' }, `Try ${3 - done.length} more shot${3 - done.length === 1 ? '' : 's'} to unlock the reveal.`));
  }
  const holdSl = slider({ label: 'Reaction hold', min: 1, max: 4, step: 0.5, value: hold, fmt: (v) => `${v}s`, onInput: (v) => { hold = v; } });
  const buttons = h('div', { class: 'chips', role: 'group', 'aria-label': 'Choose shot B' }, Object.entries(SHOTS).map(([k, s]) => h('button', { class: 'chip', type: 'button', on: { click: () => play(k) } }, `▶ ${s.name}`)));
  root.append(h('p', {}, 'Choose a shot B and watch the 3-shot sequence (man → shot B → man), then say what the man felt. Do it for at least three shots.'),
    buttons, h('div', { class: 'canvas-wrap' }, cv), caption, ask, holdSl.row, results,
    h('section', { class: 'card' }, h('h2', { class: 'h4' }, 'Use it in your edits'), h('ul', { class: 'checks' },
      h('li', {}, 'Steal reaction shots from other takes. The context will give them meaning.'),
      h('li', {}, 'In interviews, the cutaway before a pause tells the audience how to read the silence.'),
      h('li', {}, 'Comedy and horror often use the same footage, and the juxtaposition decides which genre you are in.'))));
  show('face');
  caption.textContent = 'Press a shot to begin the experiment.';
}
