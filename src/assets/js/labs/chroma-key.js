import { initLab, h, slider, select, fileButton, rafThrottle, toast } from './_lab.js';
import { keyAlpha, suppressSpill, hexToRgb } from './lib.js';
import { paintScene, loadImageFile, drawFitted } from '../core/ui.js';

const root = initLab('chroma-key');
if (root) {
  const fg = document.createElement('canvas'); const fctx = fg.getContext('2d', { willReadFrequently: true });
  const bg = document.createElement('canvas'); const bctx = bg.getContext('2d');
  paintScene(fctx, 960, 540, { green: true });
  let fgData = fctx.getImageData(0, 0, fg.width, fg.height);
  function paintBg() {
    bg.width = fg.width; bg.height = fg.height;
    const g = bctx.createLinearGradient(0, 0, 0, bg.height); g.addColorStop(0, '#1b2a4a'); g.addColorStop(.6, '#e07a3a'); g.addColorStop(1, '#2b1a14');
    bctx.fillStyle = g; bctx.fillRect(0, 0, bg.width, bg.height);
    bctx.fillStyle = '#111'; for (let i = 0; i < 14; i++) { const w = 40 + (i * 37) % 60, hh = 120 + (i * 53) % 200; bctx.fillRect(i * (bg.width / 14), bg.height - hh, w, hh); }
  }
  paintBg();
  const out = h('canvas', { role: 'img', 'aria-label': 'Keyed composite' }); const octx = out.getContext('2d');
  const st = { key: [34, 197, 82], tol: 0.12, soft: 0.08, spill: 0.7, view: 'comp', bgOn: true };
  const render = rafThrottle(() => {
    out.width = fg.width; out.height = fg.height;
    const res = octx.createImageData(fg.width, fg.height); const s = fgData.data, d = res.data;
    const bgd = bctx.getImageData(0, 0, bg.width, bg.height).data;
    for (let i = 0; i < s.length; i += 4) {
      const r = s[i], g = s[i + 1], b = s[i + 2];
      const a = keyAlpha(r, g, b, st.key, st.tol, st.soft);
      if (st.view === 'matte') { const v = a * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; continue; }
      if (st.view === 'orig') { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; continue; }
      const g2 = suppressSpill(r, g, b, st.spill);
      const br = st.bgOn ? bgd[i] : (((i / 4) % fg.width >> 4) + (((i / 4) / fg.width) >> 4)) % 2 ? 90 : 60;
      const bgg = st.bgOn ? bgd[i + 1] : br, bb = st.bgOn ? bgd[i + 2] : br;
      d[i] = r * a + br * (1 - a); d[i + 1] = g2 * a + bgg * (1 - a); d[i + 2] = b * a + bb * (1 - a); d[i + 3] = 255;
    }
    octx.putImageData(res, 0, 0);
  });
  const tol = slider({ label: 'Tolerance', min: 0, max: 0.4, step: 0.005, value: st.tol, fmt: (v) => v.toFixed(3), onInput: (v) => { st.tol = v; render(); } });
  const soft = slider({ label: 'Softness', min: 0, max: 0.3, step: 0.005, value: st.soft, fmt: (v) => v.toFixed(3), onInput: (v) => { st.soft = v; render(); } });
  const spill = slider({ label: 'Spill suppress', min: 0, max: 1, step: 0.01, value: st.spill, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.spill = v; render(); } });
  const view = select({ label: 'View', value: 'comp', options: [['comp', 'Composite'], ['matte', 'Matte (alpha)'], ['orig', 'Original']], onChange: (v) => { st.view = v; render(); } });
  const bgSel = select({ label: 'Background', value: 'scene', options: [['scene', 'City sunset'], ['checker', 'Transparency checker']], onChange: (v) => { st.bgOn = v === 'scene'; render(); } });
  const keyPick = h('input', { type: 'color', value: '#22c552', 'aria-label': 'Key color' });
  keyPick.addEventListener('input', () => { const k = hexToRgb(keyPick.value); if (k) { st.key = k; render(); } });
  out.addEventListener('click', (e) => { // eyedropper: click the canvas to sample the key color
    const r = out.getBoundingClientRect(); const x = Math.floor(((e.clientX - r.left) / r.width) * fg.width), y = Math.floor(((e.clientY - r.top) / r.height) * fg.height);
    const i = (y * fg.width + x) * 4; st.key = [fgData.data[i], fgData.data[i + 1], fgData.data[i + 2]];
    keyPick.value = '#' + st.key.map((v) => v.toString(16).padStart(2, '0')).join(''); render(); toast('Key color sampled');
  });
  const up = fileButton('Load green-screen image', async (f) => { try { const img = await loadImageFile(f); drawFitted(fctx, img, 960, 640); fgData = fctx.getImageData(0, 0, fg.width, fg.height); paintBg(); render(); } catch (e) { toast(e.message, 'err'); } });
  const challenge = h('p', { class: 'callout tip' }, h('strong', {}, 'Challenge: '), 'Switch to Matte view. Make the background pure black and the subject pure white, keeping hair strands soft grey. Then go back to Composite and remove the green spill on the cheek.');
  root.append(h('div', { class: 'ctl-row' }, view.row, bgSel.row, h('label', {}, 'Key color ', keyPick), up),
    h('div', { class: 'lab-grid-2' }, h('div', {}, h('div', { class: 'canvas-wrap' }, out), h('p', { class: 'muted small' }, 'Tip: click the image to sample the key color.')), h('div', { class: 'lab-controls' }, tol.row, soft.row, spill.row, challenge)));
  render();
}
