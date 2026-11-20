import { initLab, h, select, resultGrid, clear } from './_lab.js';
import { FPS_OPTIONS, fpsById, framesToTC, parseTC, framesToSeconds } from './lib.js';

const root = initLab('timecode');
if (root) {
  let rate = fpsById('29.97df');
  const fpsSel = select({ label: 'Frame rate', value: rate.id, options: FPS_OPTIONS.map((f) => [f.id, f.label]), onChange: (v) => { rate = fpsById(v); all(); } });

  const tcIn = h('input', { type: 'text', value: '00:10:00;00', 'aria-label': 'Timecode', maxlength: '16', spellcheck: 'false', autocomplete: 'off' });
  const fIn = h('input', { type: 'number', value: '17982', min: '0', max: '100000000', step: '1', 'aria-label': 'Frame count' });
  const aIn = h('input', { type: 'text', value: '00:59:58;12', 'aria-label': 'Timecode A', maxlength: '16', spellcheck: 'false' });
  const bIn = h('input', { type: 'text', value: '00:00:04;00', 'aria-label': 'Timecode B', maxlength: '16', spellcheck: 'false' });
  const opSel = h('select', { 'aria-label': 'Operation' }, h('option', { value: 'add' }, '+'), h('option', { value: 'sub' }, '−'));
  const o1 = h('div'), o2 = h('div'), o3 = h('div');
  const err = (e) => h('p', { class: 'form-error' }, e.message);
  const secs = (s) => { const a = Math.abs(s); const hh = Math.floor(a / 3600), mm = Math.floor((a % 3600) / 60), ss = (a % 60).toFixed(3); return `${s < 0 ? '-' : ''}${hh}h ${mm}m ${ss}s`; };

  function tcToFrames() {
    try { const f = parseTC(tcIn.value, rate); clear(o1).append(resultGrid([['Frames', f.toLocaleString()], ['Real time', secs(framesToSeconds(f, rate))], ['Normalised TC', framesToTC(f, rate)]])); } catch (e) { clear(o1).append(err(e)); }
  }
  function framesToTc() {
    const n = Number(fIn.value);
    if (!Number.isInteger(n) || n < 0 || n > 1e8) { clear(o2).append(err(new Error('Enter a whole number of frames (0 – 100,000,000).'))); return; }
    clear(o2).append(resultGrid([['Timecode', framesToTC(n, rate)], ['Real time', secs(framesToSeconds(n, rate))]]));
  }
  function math() {
    try {
      const a = parseTC(aIn.value, rate), b = parseTC(bIn.value, rate);
      const r = opSel.value === 'add' ? a + b : a - b;
      clear(o3).append(resultGrid([['Result', framesToTC(r, rate)], ['Frames', r.toLocaleString()], ['Real time', secs(framesToSeconds(r, rate))]]));
    } catch (e) { clear(o3).append(err(e)); }
  }
  function all() {
    const sep = rate.df ? ';' : ':';
    for (const el of [tcIn, aIn, bIn]) el.value = el.value.replace(/[:;](\d{1,3})$/, `${sep}$1`);
    tcToFrames(); framesToTc(); math();
  }
  tcIn.addEventListener('input', tcToFrames); fIn.addEventListener('input', framesToTc);
  for (const el of [aIn, bIn, opSel]) el.addEventListener('input', math);
  root.append(fpsSel.row,
    h('section', {}, h('h2', { class: 'h4' }, 'Timecode → frames'), tcIn, o1),
    h('section', {}, h('h2', { class: 'h4' }, 'Frames → timecode'), fIn, o2),
    h('section', {}, h('h2', { class: 'h4' }, 'Timecode math'), h('div', { class: 'ctl-row' }, aIn, opSel, bIn), o3),
    h('p', { class: 'muted small' }, 'Drop-frame check: at 29.97 DF, the timecode after 00:00:59;29 is 00:01:00;02, because labels ;00 and ;01 are skipped. At 00:10:00;00 nothing is skipped. Try it above.'));
  all();
}
