import { initLab, h, slider, select, rafThrottle, fileButton, toast } from './_lab.js';
import { applyGrade, buildGradeLUT, LOOK_PRESETS, rgbToCbCr } from './lib.js';
import { paintScene, loadImageFile, drawFitted } from '../core/ui.js';

const root = initLab('color-grading');
if (root) {
  const view = h('canvas', { 'aria-label': 'Graded image preview', role: 'img' });
  const vctx = view.getContext('2d', { willReadFrequently: true });
  const src = document.createElement('canvas');
  const sctx = src.getContext('2d', { willReadFrequently: true });
  paintScene(sctx, 960, 540);
  let srcData = sctx.getImageData(0, 0, src.width, src.height);

  const scopeSize = { w: 300, h: 170 };
  const mk = (cap, w = scopeSize.w, hh = scopeSize.h) => { const c = h('canvas', { width: w, height: hh, 'aria-hidden': 'true' }); return { c, fig: h('figure', { class: 'scope' }, c, h('figcaption', {}, cap)) }; };
  const wave = mk('Luma waveform'), parade = mk('RGB parade'), vec = mk('Vectorscope', 200, 200), hist = mk('Histogram');

  const P = {};
  const defaults = { offset: 0, lift: 0, gamma: 1, gain: 1, contrast: 1, pivot: 0.435, saturation: 1, temperature: 0, tint: 0, vignette: 0, fade: 0 };
  const ctl = {};
  const sliders = [
    ['offset', 'Offset', -0.3, 0.3, 0.005], ['lift', 'Lift', -0.3, 0.3, 0.005], ['gamma', 'Gamma', 0.4, 2.2, 0.01], ['gain', 'Gain', 0.4, 1.8, 0.01],
    ['contrast', 'Contrast', 0.4, 2, 0.01], ['pivot', 'Pivot', 0.2, 0.7, 0.005], ['saturation', 'Saturation', 0, 2, 0.01],
    ['temperature', 'Temperature', -1, 1, 0.01], ['tint', 'Tint (G↔M)', -1, 1, 0.01], ['vignette', 'Vignette', 0, 1, 0.01], ['fade', 'Fade blacks', 0, 0.25, 0.005],
  ];
  let split = 1; // 1 = full graded; 0.5 = half
  let preset = {};

  const render = rafThrottle(() => {
    const p = { ...preset, ...P };
    // combine preset values multiplicatively/additively where both exist
    for (const k of Object.keys(P)) if (preset[k] != null && typeof P[k] === 'number') {
      if (['gamma', 'gain', 'contrast', 'saturation'].includes(k)) p[k] = preset[k] * P[k]; else if (k !== 'pivot') p[k] = preset[k] + P[k];
    }
    const out = vctx.createImageData(src.width, src.height);
    applyGrade(srcData.data, out.data, src.width, src.height, p, buildGradeLUT(p));
    if (split < 1) { // before/after wipe
      const cut = Math.round(src.width * split) * 4;
      const row = src.width * 4;
      for (let y = 0; y < src.height; y++) out.data.set(srcData.data.subarray(y * row + cut, (y + 1) * row), y * row + cut);
    }
    view.width = src.width; view.height = src.height;
    vctx.putImageData(out, 0, 0);
    if (split < 1) { vctx.fillStyle = '#fff'; vctx.fillRect(Math.round(src.width * split) - 1, 0, 2, src.height); vctx.font = '600 14px system-ui'; vctx.fillText('GRADED', 10, 22); vctx.fillText('ORIGINAL', Math.round(src.width * split) + 10, 22); }
    drawScopes(out);
  });

  function drawScopes(img) {
    const { data, width, height } = img;
    const step = Math.max(1, Math.round(width / 300));
    // Waveform & parade accumulate into buffers
    const W = scopeSize.w, H = scopeSize.h;
    const wbuf = new Uint16Array(W * H), pr = new Uint16Array(W * H), pg = new Uint16Array(W * H), pb = new Uint16Array(W * H);
    const vbuf = new Uint16Array(200 * 200);
    const hr = new Uint32Array(256), hg = new Uint32Array(256), hb = new Uint32Array(256);
    const third = Math.floor(W / 3);
    for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const wx = Math.floor((x / width) * W);
      wbuf[(H - 1 - Math.floor((Y / 255) * (H - 1))) * W + wx]++;
      const px = Math.floor((x / width) * third);
      pr[(H - 1 - Math.floor((r / 255) * (H - 1))) * W + px]++;
      pg[(H - 1 - Math.floor((g / 255) * (H - 1))) * W + px + third]++;
      pb[(H - 1 - Math.floor((b / 255) * (H - 1))) * W + px + third * 2]++;
      const [cb, cr] = rgbToCbCr(r / 255, g / 255, b / 255);
      const vx = Math.round(100 + cb * 180), vy = Math.round(100 - cr * 180);
      if (vx >= 0 && vx < 200 && vy >= 0 && vy < 200) vbuf[vy * 200 + vx]++;
      hr[r]++; hg[g]++; hb[b]++;
    }
    const paint = (canvas, fn) => { const c = canvas.getContext('2d'); const id = c.createImageData(canvas.width, canvas.height); fn(id.data); c.putImageData(id, 0, 0); return c; };
    const gridLines = (c, w, hh) => { c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let k = 0; k <= 4; k++) { const yy = Math.round((k / 4) * (hh - 1)) + 0.5; c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy); c.stroke(); } };
    let c = paint(wave.c, (d) => { for (let k = 0; k < wbuf.length; k++) { const v = Math.min(255, wbuf[k] * 40); d[k * 4] = v * 0.6; d[k * 4 + 1] = v; d[k * 4 + 2] = v * 0.6; d[k * 4 + 3] = 255; } });
    gridLines(c, W, H);
    c = paint(parade.c, (d) => { for (let k = 0; k < pr.length; k++) { d[k * 4] = Math.min(255, pr[k] * 50); d[k * 4 + 1] = Math.min(255, pg[k] * 50); d[k * 4 + 2] = Math.min(255, pb[k] * 50); d[k * 4 + 3] = 255; } });
    gridLines(c, W, H);
    c = paint(vec.c, (d) => { for (let k = 0; k < vbuf.length; k++) { const v = Math.min(255, vbuf[k] * 30); d[k * 4] = v * 0.8; d[k * 4 + 1] = v; d[k * 4 + 2] = v * 0.8; d[k * 4 + 3] = 255; } });
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(100, 100, 90, 0, Math.PI * 2); c.moveTo(10, 100); c.lineTo(190, 100); c.moveTo(100, 10); c.lineTo(100, 190); c.stroke();
    // 75% color targets
    c.font = '10px system-ui'; c.fillStyle = 'rgba(255,255,255,.6)';
    for (const [lab, rgb] of [['R', [.75, 0, 0]], ['Yl', [.75, .75, 0]], ['G', [0, .75, 0]], ['Cy', [0, .75, .75]], ['B', [0, 0, .75]], ['Mg', [.75, 0, .75]]]) {
      const [cb, cr] = rgbToCbCr(...rgb); const x = 100 + cb * 180, y = 100 - cr * 180;
      c.strokeRect(x - 4, y - 4, 8, 8); c.fillText(lab, x + 6, y + 3);
    }
    // skin tone line
    const [sb, sr] = rgbToCbCr(0.85, 0.64, 0.53); const ang = Math.atan2(-sr, sb);
    c.strokeStyle = 'rgba(255,200,150,.6)'; c.beginPath(); c.moveTo(100, 100); c.lineTo(100 + Math.cos(ang) * 95, 100 + Math.sin(ang) * 95); c.stroke();
    // histogram
    const hc = hist.c.getContext('2d'); hc.clearRect(0, 0, W, H); hc.fillStyle = '#050508'; hc.fillRect(0, 0, W, H);
    const max = Math.max(1, ...hr, ...hg, ...hb);
    hc.globalCompositeOperation = 'lighter';
    for (const [arr, col] of [[hr, 'rgba(255,60,60,.7)'], [hg, 'rgba(60,255,60,.7)'], [hb, 'rgba(70,110,255,.8)']]) {
      hc.fillStyle = col; hc.beginPath(); hc.moveTo(0, H);
      for (let k = 0; k < 256; k++) hc.lineTo((k / 255) * W, H - (Math.sqrt(arr[k] / max)) * (H - 4));
      hc.lineTo(W, H); hc.fill();
    }
    hc.globalCompositeOperation = 'source-over';
  }

  for (const [k, label, min, max, step] of sliders) {
    P[k] = defaults[k];
    ctl[k] = slider({ label, min, max, step, value: defaults[k], fmt: (v) => v.toFixed(2), onInput: (v) => { P[k] = v; render(); } });
  }
  const presetSel = select({
    label: 'Look preset', value: 'neutral', options: Object.entries(LOOK_PRESETS).map(([k, v]) => [k, v.name]),
    onChange: (v) => {
      preset = { ...(LOOK_PRESETS[v]?.p || {}) };
      for (const [k] of sliders) { P[k] = defaults[k]; ctl[k].set(defaults[k]); }
      if (LOOK_PRESETS[v]?.problem) toast('Use the sliders and scopes to fix this. Neutralise the parade and set black and white points.', 'ok', 5000);
      render();
    },
  });
  const splitCtl = slider({ label: 'Before/after', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => (v === 1 ? 'Graded' : v === 0 ? 'Original' : `${Math.round(v * 100)}%`), onInput: (v) => { split = v; render(); } });
  const reset = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' }, 'Reset all');
  reset.addEventListener('click', () => { preset = {}; presetSel.el.value = 'neutral'; for (const [k] of sliders) { P[k] = defaults[k]; ctl[k].set(defaults[k]); } split = 1; splitCtl.set(1); render(); });
  const sceneBtn = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' }, 'Use test scene');
  sceneBtn.addEventListener('click', () => { paintScene(sctx, 960, 540); srcData = sctx.getImageData(0, 0, src.width, src.height); render(); });
  const upload = fileButton('Load your own image', async (f) => {
    try { const img = await loadImageFile(f); drawFitted(sctx, img, 960, 640); srcData = sctx.getImageData(0, 0, src.width, src.height); render(); toast('Image loaded. It stays on your device.'); } catch (e) { toast(e.message, 'err'); }
  });
  const dl = h('button', { class: 'btn btn-sm', type: 'button' }, 'Export graded PNG');
  dl.addEventListener('click', () => view.toBlob((b) => { if (!b) return; const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'hypercut-grade.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1500); }));

  root.append(
    h('div', { class: 'ctl-row' }, presetSel.row, upload, sceneBtn, reset, dl),
    h('div', { class: 'lab-grid-2' },
      h('div', {}, h('div', { class: 'canvas-wrap' }, view), splitCtl.row, h('div', { class: 'scopes' }, wave.fig, parade.fig, vec.fig, hist.fig)),
      h('div', { class: 'lab-controls' }, h('h2', { class: 'h4' }, 'Primaries'), sliders.slice(0, 7).map(([k]) => ctl[k].row), h('h2', { class: 'h4' }, 'Balance & finishing'), sliders.slice(7).map(([k]) => ctl[k].row),
        h('p', { class: 'muted small' }, 'Tip: on the RGB parade, a neutral grey ramp (bottom strip) should line up across R, G and B. Skin should sit on the orange line in the vectorscope.')),
    ),
  );
  render();
}
