import { initLab, h, fileButton, slider, toast } from './_lab.js';
import { paintScene, loadImageFile, drawFitted } from '../core/ui.js';

const root = initLab('composition');
if (root) {
  const base = document.createElement('canvas');
  const bctx = base.getContext('2d');
  paintScene(bctx, 960, 540);
  const cv = h('canvas', { role: 'img', 'aria-label': 'Frame with composition overlays' });
  const ctx = cv.getContext('2d');
  const on = { thirds: true, phi: false, diag: false, center: false, spiral: false };
  let opacity = 0.8;
  const PHI = 0.381966;

  function spiral(c, x, y, w, hh, depth) {
    // Golden spiral approximation via quarter arcs inside successive golden rectangles.
    let dir = 0;
    for (let i = 0; i < depth && w > 2 && hh > 2; i++) {
      c.beginPath();
      if (dir === 0) { const s = hh; c.arc(x + s, y + s, s, Math.PI, 1.5 * Math.PI); x += s; w -= s; }
      else if (dir === 1) { const s = w; c.arc(x, y + s, s, 1.5 * Math.PI, 2 * Math.PI); y += s; hh -= s; }
      else if (dir === 2) { const s = hh; c.arc(x + w - s, y, s, 0, 0.5 * Math.PI); w -= s; }
      else { const s = w; c.arc(x + s, y + hh - s, s, 0.5 * Math.PI, Math.PI); hh -= s; }
      c.stroke(); dir = (dir + 1) % 4;
    }
  }
  function render() {
    cv.width = base.width; cv.height = base.height;
    const W = cv.width, H = cv.height;
    ctx.drawImage(base, 0, 0);
    ctx.globalAlpha = opacity; ctx.lineWidth = Math.max(1.5, W / 480);
    const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    if (on.thirds) { ctx.strokeStyle = '#00e0ff'; for (const f of [1 / 3, 2 / 3]) { line(W * f, 0, W * f, H); line(0, H * f, W, H * f); } ctx.fillStyle = '#00e0ff'; for (const fx of [1 / 3, 2 / 3]) for (const fy of [1 / 3, 2 / 3]) { ctx.beginPath(); ctx.arc(W * fx, H * fy, 6, 0, Math.PI * 2); ctx.fill(); } }
    if (on.phi) { ctx.strokeStyle = '#ffd23f'; for (const f of [PHI, 1 - PHI]) { line(W * f, 0, W * f, H); line(0, H * f, W, H * f); } }
    if (on.diag) { ctx.strokeStyle = '#ff3d7f'; line(0, 0, W, H); line(W, 0, 0, H); line(0, H, W * 0.5, 0); line(W * 0.5, 0, W, H); }
    if (on.center) { ctx.strokeStyle = '#ffffff'; line(W / 2, 0, W / 2, H); line(0, H / 2, W, H / 2); ctx.strokeRect(W * 0.05, H * 0.05, W * 0.9, H * 0.9); }
    if (on.spiral) { ctx.strokeStyle = '#3ddc97'; const gw = Math.min(W, H * 1.618), gh = gw / 1.618; spiral(ctx, (W - gw) / 2, (H - gh) / 2, gw, gh, 9); }
    ctx.globalAlpha = 1;
  }
  const toggles = h('div', { class: 'chips', role: 'group', 'aria-label': 'Overlays' }, [['thirds', 'Rule of thirds'], ['phi', 'Golden ratio grid'], ['spiral', 'Golden spiral'], ['diag', 'Diagonals'], ['center', 'Centre + 90% safe']].map(([k, label]) => {
    const b = h('button', { class: `chip ${on[k] ? 'active' : ''}`, type: 'button', 'aria-pressed': String(on[k]) }, label);
    b.addEventListener('click', () => { on[k] = !on[k]; b.classList.toggle('active', on[k]); b.setAttribute('aria-pressed', String(on[k])); render(); });
    return b;
  }));
  const op = slider({ label: 'Overlay opacity', min: 0.1, max: 1, step: 0.05, value: 0.8, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { opacity = v; render(); } });
  const up = fileButton('Load your frame', async (f) => { try { const img = await loadImageFile(f); drawFitted(bctx, img, 1280, 900); render(); } catch (e) { toast(e.message, 'err'); } });
  root.append(h('div', { class: 'ctl-row' }, up), toggles, h('div', { class: 'canvas-wrap' }, cv), op.row,
    h('div', { class: 'callout tip' }, h('strong', {}, 'Checklist: '), 'Are the eyes near the top third line? Is there lead room in the direction of the gaze? Do strong lines lead to the subject? Is the horizon level and placed on a third?'));
  render();
}
