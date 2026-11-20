import { initLab, h, select, clear, resultGrid, copyText } from './_lab.js';
import { PLATFORMS, exportSpec, ffmpegCommand } from './lib2.js';

const root = initLab('export-settings');
if (root) {
  const st = { platform: 'youtube', fps: '25', src: '1920x1080', name: 'my_edit.mov' };
  const out = h('div');
  function update() {
    const [w, hh] = st.src.split('x').map(Number);
    const spec = exportSpec(st.platform, { fps: Number(st.fps), srcW: w, srcH: hh });
    const cmd = ffmpegCommand(spec, st.name);
    clear(out).append(
      resultGrid([['Container', spec.container], ['Video codec', spec.vcodec], ['Resolution', `${spec.w}×${spec.h}`], ['Frame rate', `${spec.fps} fps (match source)`], ['Target bitrate', spec.mbps ? `${spec.mbps} Mbps (VBR)` : 'Codec-defined'], ['Audio', spec.audio], ['Loudness', spec.lufs != null ? `${spec.lufs} LUFS, peaks ≤ ${spec.tp} dBTP` : `Unprocessed, peaks ≤ ${spec.tp} dBFS`], ['Color', 'Rec.709, tagged 1-1-1, video (limited) range']]),
      h('h2', { class: 'h4' }, 'Checklist'), h('ul', { class: 'checks' }, spec.notes.map((n) => h('li', {}, n)), h('li', {}, 'Watch the full export once before sending it.')),
      h('h2', { class: 'h4' }, 'FFmpeg command (free, works on every OS)'),
      h('div', { class: 'code-out' }, h('pre', {}, h('code', {}, cmd)), h('button', { class: 'btn btn-sm', type: 'button', on: { click: () => copyText(cmd) } }, 'Copy command')),
      h('p', { class: 'muted small' }, 'The loudnorm filter is single-pass here. For exact broadcast loudness, run a two-pass loudnorm or normalise in your editor first. Hardware encoders (NVENC, VideoToolbox) are faster, but x264 "slow" gives the best quality per bit.'));
  }
  const p = select({ label: 'Destination', value: st.platform, options: Object.entries(PLATFORMS).map(([k, v]) => [k, v.name]), onChange: (v) => { st.platform = v; update(); } });
  const f = select({ label: 'Source fps', value: st.fps, options: ['23.976', '24', '25', '29.97', '30', '50', '59.94', '60'].map((x) => [x, x]), onChange: (v) => { st.fps = v; update(); } });
  const s = select({ label: 'Source resolution', value: st.src, options: [['1920x1080', 'HD 1920×1080'], ['3840x2160', 'UHD 3840×2160'], ['4096x2160', 'DCI 4K'], ['1080x1920', 'Vertical 1080×1920']], onChange: (v) => { st.src = v; update(); } });
  const nameIn = h('input', { type: 'text', value: st.name, maxlength: '80', 'aria-label': 'Input file name', spellcheck: 'false' });
  nameIn.addEventListener('input', () => { st.name = nameIn.value; update(); });
  root.append(h('div', { class: 'ctl-row' }, p.row, f.row, s.row), h('div', { class: 'ctl-row' }, h('label', {}, 'Input file name ', nameIn)), out);
  update();
}
