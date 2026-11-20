import { initLab, h, select, slider, clear } from './_lab.js';
import { paintScene } from '../core/ui.js';

const MODES = {
  'source-over': ['Normal', 'Top replaces bottom (with opacity).', 'Default.'],
  multiply: ['Multiply', 'a × b. Always darker, white disappears.', 'Shadows, dirt, removing white backgrounds.'],
  screen: ['Screen', '1 − (1−a)(1−b). Always lighter, black disappears.', 'Light leaks, fire, lens flares shot on black.'],
  lighter: ['Add (Linear Dodge)', 'a + b, clipped. Very bright.', 'Glows, sparks, energy effects.'],
  overlay: ['Overlay', 'Multiply darks, screen lights (based on the bottom layer).', 'Contrast, textures.'],
  'soft-light': ['Soft Light', 'A gentle overlay.', 'Film grain, subtle textures, dodge and burn.'],
  'hard-light': ['Hard Light', 'Overlay based on the top layer.', 'Punchy texture.'],
  darken: ['Darken', 'min(a, b)', 'Combining dark elements.'],
  lighten: ['Lighten', 'max(a, b)', 'Combining bright elements.'],
  'color-dodge': ['Color Dodge', 'b ÷ (1 − a). Intense brightening.', 'Hot highlights, glows.'],
  'color-burn': ['Color Burn', '1 − (1 − b) ÷ a. Intense darkening.', 'Deep, rich shadows.'],
  difference: ['Difference', '|a − b|', 'Checking alignment: identical = black.'],
  exclusion: ['Exclusion', 'a + b − 2ab', 'Psychedelic looks.'],
  hue: ['Hue', 'Hue of top, saturation and luma of bottom.', 'Recolouring.'],
  saturation: ['Saturation', 'Saturation of top.', 'Selective desaturation.'],
  color: ['Color', 'Hue and saturation of top, luma of bottom.', 'Tinting and color grading layers.'],
  luminosity: ['Luminosity', 'Luma of top.', 'Sharpening without color shifts.'],
};

const root = initLab('blend-modes');
if (root) {
  const base = document.createElement('canvas'); paintScene(base.getContext('2d'), 960, 540);
  const top = document.createElement('canvas'); top.width = 960; top.height = 540; const tctx = top.getContext('2d');
  const cv = h('canvas', { width: 960, height: 540, role: 'img', 'aria-label': 'Blended result' }); const ctx = cv.getContext('2d');
  const st = { mode: 'screen', layer: 'leak', opacity: 1 };
  const info = h('div', { class: 'card' });

  function paintTop() {
    tctx.clearRect(0, 0, 960, 540);
    if (st.layer === 'leak') { tctx.fillStyle = '#000'; tctx.fillRect(0, 0, 960, 540); for (const [x, y, r, c] of [[120, 80, 380, 'rgba(255,120,30,.9)'], [860, 460, 420, 'rgba(255,40,90,.7)'], [700, 60, 220, 'rgba(255,220,120,.8)']]) { const g = tctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); tctx.fillStyle = g; tctx.fillRect(0, 0, 960, 540); } }
    else if (st.layer === 'gradient') { const g = tctx.createLinearGradient(0, 0, 960, 540); g.addColorStop(0, '#00a2c7'); g.addColorStop(1, '#ff7a1a'); tctx.fillStyle = g; tctx.fillRect(0, 0, 960, 540); }
    else if (st.layer === 'grain') { const id = tctx.createImageData(960, 540); for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } tctx.putImageData(id, 0, 0); }
    else if (st.layer === 'teal') { tctx.fillStyle = '#167d8a'; tctx.fillRect(0, 0, 960, 540); }
    else if (st.layer === 'text') { tctx.fillStyle = '#fff'; tctx.fillRect(0, 0, 960, 540); tctx.fillStyle = '#000'; tctx.font = '900 150px system-ui'; tctx.textAlign = 'center'; tctx.fillText('HYPERCUT', 480, 320); }
  }
  function render() {
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = st.mode; ctx.globalAlpha = st.opacity; ctx.drawImage(top, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const [n, f, u] = MODES[st.mode];
    clear(info).append(h('h2', { class: 'h4' }, n), h('p', {}, h('strong', {}, 'Math: '), f), h('p', {}, h('strong', {}, 'Use it for: '), u));
  }
  const mode = select({ label: 'Blend mode', value: st.mode, options: Object.entries(MODES).map(([k, v]) => [k, v[0]]), onChange: (v) => { st.mode = v; render(); } });
  const layer = select({ label: 'Top layer', value: st.layer, options: [['leak', 'Light leak (on black)'], ['gradient', 'Teal→orange gradient'], ['grain', 'Film grain (50% grey)'], ['teal', 'Solid teal'], ['text', 'Black text on white']], onChange: (v) => { st.layer = v; paintTop(); render(); } });
  const op = slider({ label: 'Opacity', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { st.opacity = v; render(); } });
  root.append(h('div', { class: 'ctl-row' }, mode.row, layer.row), h('div', { class: 'lab-grid-2' }, h('div', { class: 'canvas-wrap' }, cv), h('div', { class: 'lab-controls' }, op.row, info,
    h('p', { class: 'muted small' }, 'Try: light leak + Screen, grain + Overlay or Soft Light, text + Multiply (the white disappears), teal + Color (a quick tint).'))));
  paintTop(); render();
}
