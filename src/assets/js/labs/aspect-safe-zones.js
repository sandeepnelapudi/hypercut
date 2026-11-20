import { initLab, h, select, slider, fileButton, toast } from './_lab.js';
import { paintScene, loadImageFile, drawFitted } from '../core/ui.js';

const ASPECTS = { '16:9': 16 / 9, '9:16': 9 / 16, '4:5': 4 / 5, '1:1': 1, '2.39:1': 2.39, '1.85:1': 1.85, '4:3': 4 / 3 };
// Approximate UI overlay regions as fractions of a 9:16 frame (they vary by app version/device).
const PLATFORM = {
  none: { name: 'None', zones: [] },
  tiktok: { name: 'TikTok', zones: [{ x: 0, y: 0, w: 1, h: 0.09, l: 'Top bar' }, { x: 0, y: 0.76, w: 0.8, h: 0.24, l: 'Caption & sound' }, { x: 0.84, y: 0.36, w: 0.16, h: 0.52, l: 'Actions' }] },
  reels: { name: 'Instagram Reels', zones: [{ x: 0, y: 0, w: 1, h: 0.07, l: 'Top bar' }, { x: 0, y: 0.8, w: 0.82, h: 0.2, l: 'Caption & user' }, { x: 0.85, y: 0.5, w: 0.15, h: 0.45, l: 'Actions' }] },
  shorts: { name: 'YouTube Shorts', zones: [{ x: 0, y: 0, w: 1, h: 0.08, l: 'Top bar' }, { x: 0, y: 0.78, w: 0.8, h: 0.22, l: 'Title & channel' }, { x: 0.85, y: 0.42, w: 0.15, h: 0.5, l: 'Actions' }] },
};

const root = initLab('aspect-safe-zones');
if (root) {
  const src = document.createElement('canvas');
  const sctx = src.getContext('2d');
  paintScene(sctx, 1920, 1080);
  const cv = h('canvas', { role: 'img', 'aria-label': 'Reframed preview with safe zones' });
  const ctx = cv.getContext('2d');
  const st = { aspect: '9:16', platform: 'tiktok', pan: 0.38, title: true };

  function render() {
    const a = ASPECTS[st.aspect];
    const maxH = 560, maxW = 900;
    let W = maxW, H = W / a; if (H > maxH) { H = maxH; W = H * a; }
    cv.width = Math.round(W); cv.height = Math.round(H);
    // Crop source (16:9) to target aspect, panning horizontally or vertically.
    const sa = src.width / src.height;
    let sw, sh, sx, sy;
    if (a < sa) { sh = src.height; sw = sh * a; sx = (src.width - sw) * st.pan; sy = 0; } else { sw = src.width; sh = sw / a; sx = 0; sy = (src.height - sh) * st.pan; }
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    if (st.title) {
      ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.strokeRect(cv.width * 0.05, cv.height * 0.05, cv.width * 0.9, cv.height * 0.9);
      ctx.strokeStyle = 'rgba(255,210,63,.8)'; ctx.strokeRect(cv.width * 0.035, cv.height * 0.035, cv.width * 0.93, cv.height * 0.93);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '11px system-ui'; ctx.fillText('Title safe 90%', cv.width * 0.05 + 4, cv.height * 0.05 + 14); ctx.fillStyle = 'rgba(255,210,63,.9)'; ctx.fillText('Action safe 93%', cv.width * 0.035 + 4, cv.height * 0.965 - 4);
    }
    if (st.aspect === '9:16') for (const z of PLATFORM[st.platform].zones) {
      ctx.fillStyle = 'rgba(255,61,127,.35)'; ctx.fillRect(z.x * cv.width, z.y * cv.height, z.w * cv.width, z.h * cv.height);
      ctx.fillStyle = '#fff'; ctx.font = '600 12px system-ui'; ctx.fillText(z.l, z.x * cv.width + 6, z.y * cv.height + 16);
    }
    info.textContent = st.aspect === '9:16' ? 'Pink areas are covered by platform UI (approximate; varies by app and device). Keep faces and captions in the clear centre.' : 'Dashed boxes show broadcast title-safe (90%) and action-safe (93%) areas.';
  }
  const info = h('p', { class: 'muted small' });
  const asp = select({ label: 'Delivery aspect', value: st.aspect, options: Object.keys(ASPECTS).map((k) => [k, k]), onChange: (v) => { st.aspect = v; render(); } });
  const plat = select({ label: 'Platform UI (9:16)', value: st.platform, options: Object.entries(PLATFORM).map(([k, v]) => [k, v.name]), onChange: (v) => { st.platform = v; render(); } });
  const pan = slider({ label: 'Reframe (pan)', min: 0, max: 1, step: 0.01, value: st.pan, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.pan = v; render(); } });
  const safe = h('input', { type: 'checkbox', id: 'safe-tg', checked: true });
  safe.addEventListener('change', () => { st.title = safe.checked; render(); });
  const up = fileButton('Load a 16:9 frame', async (f) => { try { const img = await loadImageFile(f); drawFitted(sctx, img, 1920, 1920); render(); } catch (e) { toast(e.message, 'err'); } });
  root.append(h('div', { class: 'ctl-row' }, asp.row, plat.row, h('label', { for: 'safe-tg' }, safe, ' Broadcast safe areas'), up), h('div', { class: 'canvas-wrap center' }, cv), pan.row, info);
  render();
}
