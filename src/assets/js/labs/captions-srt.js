import { initLab, h, numberInput, clear, toast, download } from './_lab.js';
import { buildCaptions, toSRT, toVTT, parseSRT, srtTime } from './lib2.js';

const SAMPLE = 'Most editors cut too early. After a big line, hold on the face for one more beat. Let the audience feel it. Then cut. That single habit will make your edits feel twice as professional.';

const root = initLab('captions-srt');
if (root) {
  const st = { dur: 14, maxChars: 32, lines: 2, cps: 17 };
  let caps = [];
  const text = h('textarea', { rows: '6', maxlength: '20000', 'aria-label': 'Transcript text', placeholder: 'Paste your transcript here…' });
  text.value = SAMPLE;
  const out = h('div'); const preview = h('div', { class: 'canvas-wrap' }); const checkOut = h('div');
  const frame = h('canvas', { width: 640, height: 360, role: 'img', 'aria-label': 'Caption preview' });
  preview.append(frame);
  const scrub = h('input', { type: 'range', min: '0', max: '1000', value: '0', 'aria-label': 'Preview time' });

  function drawPreview() {
    const c = frame.getContext('2d'); const g = c.createLinearGradient(0, 0, 640, 360); g.addColorStop(0, '#2a3550'); g.addColorStop(1, '#6b3b4a'); c.fillStyle = g; c.fillRect(0, 0, 640, 360);
    const t = (Number(scrub.value) / 1000) * st.dur;
    const cap = caps.find((x) => t >= x.start && t < x.end) || caps[caps.length - 1];
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '12px ui-monospace, monospace'; c.fillText(srtTime(t), 10, 18);
    if (!cap) return;
    c.font = '700 24px system-ui'; c.textAlign = 'center';
    cap.lines.forEach((l, i) => { const y = 300 - (cap.lines.length - 1 - i) * 32; c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText(l, 320, y); c.fillStyle = '#fff'; c.fillText(l, 320, y); });
    c.textAlign = 'start';
  }
  function generate() {
    try { caps = buildCaptions(text.value, { duration: st.dur, maxChars: st.maxChars, maxLines: st.lines, maxCps: st.cps }); } catch (e) { clear(out).append(h('p', { class: 'form-error' }, e.message)); return; }
    const warns = caps.filter((c) => c.warn).length;
    clear(out).append(
      h('p', {}, `${caps.length} captions. `, warns ? h('span', { class: 'warn-text' }, `${warns} are too fast to read comfortably. Increase the duration or shorten the text.`) : '✓ All captions are within reading speed.'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'data-table' }, h('thead', {}, h('tr', {}, ['#', 'In', 'Out', 'Text', 'Chars/s'].map((t) => h('th', {}, t)))),
        h('tbody', {}, caps.map((c) => h('tr', {}, h('td', {}, String(c.index)), h('td', {}, srtTime(c.start)), h('td', {}, srtTime(c.end)), h('td', {}, c.lines.join(' / ')), h('td', { class: c.warn ? 'warn-text' : '' }, c.cps.toFixed(1))))))),
      h('div', { class: 'row-gap' }, h('button', { class: 'btn btn-sm', type: 'button', on: { click: () => download('captions.srt', toSRT(caps), 'application/x-subrip') } }, 'Download .srt'),
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => download('captions.vtt', toVTT(caps), 'text/vtt') } }, 'Download .vtt')));
    drawPreview();
  }
  const ni = (label, key, min, max, step = 1) => numberInput({ label, value: st[key], min, max, step, onInput: (v) => { const n = Number(v); if (Number.isFinite(n) && n >= min && n <= max) { st[key] = n; generate(); } } });
  const genBtn = h('button', { class: 'btn', type: 'button', on: { click: () => { generate(); toast('Captions generated'); } } }, 'Generate captions');
  text.addEventListener('input', () => { if (text.value.length > 20000) text.value = text.value.slice(0, 20000); });
  scrub.addEventListener('input', drawPreview);

  const srtIn = h('textarea', { rows: '6', maxlength: '200000', 'aria-label': 'Existing SRT to check', placeholder: '1\n00:00:00,000 --> 00:00:02,500\nPaste an existing SRT to check it…' });
  const checkBtn = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => {
    const r = parseSRT(srtIn.value);
    const fast = r.caps.filter((c) => c.cps > st.cps);
    clear(checkOut).append(h('p', {}, `${r.caps.length} captions parsed.`),
      r.errors.length || fast.length ? h('ul', { class: 'warn-text' }, r.errors.map((e) => h('li', {}, e)), fast.map((c) => h('li', {}, `Caption ${c.index} is too fast: ${c.cps.toFixed(1)} characters/sec`))) : h('p', {}, '✓ No problems found.'));
  } } }, 'Check SRT');

  root.append(h('h2', { class: 'h4' }, '1. Transcript → timed captions'), text,
    h('div', { class: 'ctl-row' }, ni('Duration (s)', 'dur', 1, 36000, 0.1), ni('Max chars/line', 'maxChars', 10, 80), ni('Lines', 'lines', 1, 3), ni('Max chars/sec', 'cps', 10, 30)), genBtn, out,
    h('h2', { class: 'h4' }, 'Preview'), preview, scrub,
    h('h2', { class: 'h4' }, '2. Check an existing SRT'), srtIn, checkBtn, checkOut,
    h('p', { class: 'muted small' }, 'Pro standards: 1–2 lines, up to 42 characters per line (32 for vertical video), and no more than about 17 characters per second. Timings here are spread by character count, so after importing the SRT into your editor, nudge each caption to the speech. Or use your editor\'s auto-transcribe and run its SRT through the checker.'));
  generate();
}
