import { initLab, h, slider, select, fileButton, missionPanel, clear, resultGrid, toast } from './_lab.js';
import { compressImage } from './lib2.js';
import { paintScene, loadImageFile, debounce } from '../core/ui.js';

const root = initLab('compression');
if (root) {
  const W = 480, H = 272;
  const src = document.createElement('canvas'); const sctx = src.getContext('2d', { willReadFrequently: true });
  function loadScene() {
    paintScene(sctx, W, H);
    sctx.fillStyle = '#fff'; sctx.font = '800 22px system-ui'; sctx.fillText('SHARP TEXT 4:2:0', 16, 34);
    sctx.fillStyle = '#e8102a'; sctx.font = '800 18px system-ui'; sctx.fillText('RED ON BLUE', 300, 34);
  }
  loadScene();
  const outCv = h('canvas', { width: W, height: H, role: 'img', 'aria-label': 'Compressed image' });
  const zoomA = h('canvas', { width: 240, height: 240, role: 'img', 'aria-label': 'Original, zoomed 4×' });
  const zoomB = h('canvas', { width: 240, height: 240, role: 'img', 'aria-label': 'Compressed, zoomed 4×' });
  const stats = h('div');
  const st = { quality: 50, sub: '420', grid: false, zx: 0.3, zy: 0.3 };
  let last = null;

  function drawZoom(cv, source) {
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
    const sx = Math.round(st.zx * (W - 60)), sy = Math.round(st.zy * (H - 60));
    c.drawImage(source, sx, sy, 60, 60, 0, 0, 240, 240);
    if (st.grid) { c.strokeStyle = 'rgba(0,224,255,.55)'; c.lineWidth = 1; for (let k = -(sx % 8); k <= 60; k += 8) { c.beginPath(); c.moveTo(k * 4 + 0.5, 0); c.lineTo(k * 4 + 0.5, 240); c.stroke(); } for (let k = -(sy % 8); k <= 60; k += 8) { c.beginPath(); c.moveTo(0, k * 4 + 0.5); c.lineTo(240, k * 4 + 0.5); c.stroke(); } }
  }
  const run = debounce(() => {
    const id = sctx.getImageData(0, 0, W, H);
    const r = compressImage(id.data, W, H, { quality: st.quality, subsampling: st.sub });
    last = r;
    const out = outCv.getContext('2d'); const img = out.createImageData(W, H); img.data.set(r.data); out.putImageData(img, 0, 0);
    if (st.grid) { out.strokeStyle = 'rgba(0,224,255,.25)'; for (let x = 0; x <= W; x += 8) { out.beginPath(); out.moveTo(x + 0.5, 0); out.lineTo(x + 0.5, H); out.stroke(); } for (let y = 0; y <= H; y += 8) { out.beginPath(); out.moveTo(0, y + 0.5); out.lineTo(W, y + 0.5); out.stroke(); } }
    drawZoom(zoomA, src); drawZoom(zoomB, outCv);
    const verdict = r.psnr > 40 ? 'Visually lossless' : r.psnr > 34 ? 'Good (delivery quality)' : r.psnr > 28 ? 'Visible artifacts' : 'Heavy blocking';
    clear(stats).append(resultGrid([['Data kept', `${(r.ratio * 100).toFixed(1)}% of coefficients`], ['Relative bitrate', `≈ ${(r.ratio * 100 / 0.35).toFixed(0)}% of q90`], ['PSNR', `${r.psnr.toFixed(1)} dB`], ['Verdict', verdict]]));
    missions.check();
  }, 60);
  const q = slider({ label: 'Quality', min: 1, max: 100, value: st.quality, fmt: (v) => String(v), onInput: (v) => { st.quality = v; run(); } });
  const sub = select({ label: 'Chroma subsampling', value: st.sub, options: [['444', '4:4:4 (full color)'], ['422', '4:2:2 (broadcast)'], ['420', '4:2:0 (streaming/phones)']], onChange: (v) => { st.sub = v; run(); } });
  const gridCb = h('input', { type: 'checkbox', id: 'grid-cb' });
  gridCb.addEventListener('change', () => { st.grid = gridCb.checked; run(); });
  const zx = slider({ label: 'Zoom X', min: 0, max: 1, step: 0.01, value: st.zx, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.zx = v; run(); } });
  const zy = slider({ label: 'Zoom Y', min: 0, max: 1, step: 0.01, value: st.zy, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.zy = v; run(); } });
  const up = fileButton('Use your own image', async (f) => { try { const img = await loadImageFile(f); src.width = W; src.height = H; const s = Math.max(W / img.width, H / img.height); sctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s); run(); } catch (e) { toast(e.message, 'err'); } });
  const missions = missionPanel([
    { title: 'See the 8×8 blocks', hint: 'Turn on the block grid and drop quality to 10 or lower. Blocking appears exactly on the 8×8 grid the codec uses.', test: () => st.grid && st.quality <= 10 },
    { title: 'Spot chroma subsampling', hint: 'Set quality to 90 or higher with 4:2:0, then zoom into the red text on blue (top right, X about 70%, Y 0%). The color edges smear even at high quality.', test: () => st.quality >= 90 && st.sub === '420' && st.zx >= 0.55 && st.zy <= 0.15 },
    { title: 'Find the sweet spot', hint: 'Find settings that keep PSNR above 36 dB while storing less than 15% of the coefficients. This is what bitrate tuning is.', test: () => last && last.psnr >= 36 && last.ratio < 0.15 },
  ], { heading: 'Missions: inside the codec' });
  root.append(h('div', { class: 'ctl-row' }, sub.row, h('label', { for: 'grid-cb' }, gridCb, ' Show 8×8 block grid'), up), q.row,
    h('div', { class: 'canvas-wrap' }, outCv), stats,
    h('div', { class: 'lab-grid-2' }, h('figure', { class: 'scope' }, zoomA, h('figcaption', {}, 'Original (4× zoom)')), h('figure', { class: 'scope' }, zoomB, h('figcaption', {}, 'Compressed (4× zoom)'))),
    zx.row, zy.row, missions.el,
    h('p', { class: 'muted small' }, 'This is the actual JPEG/intra-frame pipeline: RGB → Y′CbCr → chroma subsampling → 8×8 DCT → quantization (the lossy step) → reconstruction. H.264, HEVC and ProRes use the same ideas with smarter variants.'));
  run();
}
