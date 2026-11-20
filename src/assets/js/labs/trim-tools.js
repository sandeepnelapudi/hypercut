import { initLab, h, select, missionPanel, clear } from './_lab.js';
import { ripple, roll, slip, slide, seqLength, timelineStart } from './lib2.js';

const INITIAL = [
  { id: 'A', name: 'A · Wide', in: 24, out: 96, len: 144, color: '#00a2c7' },
  { id: 'B', name: 'B · Close-up', in: 48, out: 120, len: 192, color: '#ff3d7f' },
  { id: 'C', name: 'C · Insert', in: 30, out: 102, len: 150, color: '#3ddc97' },
];
const TOOLS = {
  rippleEnd: ['Ripple (end of clip)', 'Lengthens or shortens the clip\'s end; everything after moves. Sequence length changes.'],
  rippleStart: ['Ripple (start of clip)', 'Trims the clip\'s head; everything after moves. Sequence length changes.'],
  roll: ['Roll (edit after clip)', 'Moves the cut between this clip and the next. One gets longer, the other shorter. Length unchanged.'],
  slip: ['Slip', 'Changes which part of the source you see. Position and duration unchanged.'],
  slide: ['Slide', 'Moves the clip along the timeline; its neighbours trim to compensate. Length unchanged.'],
};

const root = initLab('trim-tools');
if (root) {
  let clips = INITIAL.map((c) => ({ ...c }));
  let tool = 'rippleEnd', target = 1;
  const cv = h('canvas', { width: 900, height: 230, role: 'img', 'aria-label': 'Timeline with three clips and their source media' });
  const desc = h('p', { class: 'callout tip' });
  const table = h('div', { class: 'table-wrap' });
  const msg = h('p', { class: 'muted small', role: 'status', 'aria-live': 'polite' });
  const FPS = 24;

  function draw() {
    const c = cv.getContext('2d'); c.fillStyle = '#0b0b12'; c.fillRect(0, 0, 900, 230);
    const total = seqLength(clips), scale = 820 / 300;
    c.fillStyle = '#a3a3bd'; c.font = '11px system-ui'; c.fillText('TIMELINE', 20, 18);
    for (let f = 0; f <= 300; f += 24) { const x = 40 + f * scale; c.fillRect(x, 24, 1, 6); c.fillText(`${f / FPS}s`, x - 6, 42); }
    clips.forEach((cl, i) => {
      const x = 40 + timelineStart(clips, i) * scale, w = (cl.out - cl.in) * scale;
      c.fillStyle = cl.color; c.globalAlpha = i === target ? 1 : 0.75; c.fillRect(x, 50, w - 2, 46); c.globalAlpha = 1;
      if (i === target) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x + 1, 51, w - 4, 44); }
      c.fillStyle = '#0b0b12'; c.font = '700 12px system-ui'; c.fillText(cl.name, x + 6, 70); c.font = '11px ui-monospace, monospace'; c.fillText(`${cl.out - cl.in}f`, x + 6, 88);
      // source media bar
      const sy = 120 + i * 34; const sx = 40, sw = cl.len * scale * 0.85;
      c.fillStyle = '#1d1d2e'; c.fillRect(sx, sy, sw, 22);
      c.fillStyle = cl.color; c.globalAlpha = 0.85; c.fillRect(sx + cl.in * scale * 0.85, sy, (cl.out - cl.in) * scale * 0.85, 22); c.globalAlpha = 1;
      c.fillStyle = '#ececf4'; c.font = '11px system-ui'; c.fillText(`Source ${cl.id}: using frames ${cl.in}–${cl.out - 1} of ${cl.len} (handles: ${cl.in} before, ${cl.len - cl.out} after)`, sx + sw + 8 > 700 ? sx + 6 : sx + sw + 8, sy + 15);
    });
    c.fillStyle = '#ffd23f'; c.font = '600 12px system-ui'; c.fillText(`Sequence length: ${total} frames (${(total / FPS).toFixed(2)}s)`, 640, 18);
    clear(table).append(h('table', { class: 'data-table' }, h('thead', {}, h('tr', {}, ['Clip', 'Timeline in', 'Source in', 'Source out', 'Duration'].map((t) => h('th', {}, t)))),
      h('tbody', {}, clips.map((cl, i) => h('tr', {}, h('td', {}, cl.name), h('td', {}, String(timelineStart(clips, i))), h('td', {}, String(cl.in)), h('td', {}, String(cl.out)), h('td', {}, String(cl.out - cl.in)))))));
    desc.textContent = `${TOOLS[tool][0]}: ${TOOLS[tool][1]}`;
    missions.check();
  }
  function nudge(d) {
    const fn = { rippleEnd: (cs) => ripple(cs, target, 'end', d), rippleStart: (cs) => ripple(cs, target, 'start', d), roll: (cs) => roll(cs, target, d), slip: (cs) => slip(cs, target, d), slide: (cs) => slide(cs, target, d) }[tool];
    const r = fn(clips);
    clips = r.clips;
    msg.textContent = r.applied === d ? `Applied ${d > 0 ? '+' : ''}${d} frames.` : r.applied === 0 ? 'Blocked: not enough source handles, or that tool needs neighbouring clips (roll needs a next clip; slide needs clips on both sides).' : `Only ${r.applied} frames applied: you ran out of source handles.`;
    draw();
  }
  const toolSel = select({ label: 'Tool', value: tool, options: Object.entries(TOOLS).map(([k, v]) => [k, v[0]]), onChange: (v) => { tool = v; draw(); } });
  const clipSel = select({ label: 'Clip', value: '1', options: clips.map((c, i) => [String(i), c.name]), onChange: (v) => { target = Number(v); draw(); } });
  const btns = h('div', { class: 'ctl-row' }, [-10, -1, 1, 10].map((d) => h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => nudge(d) } }, `${d > 0 ? '+' : ''}${d}f`)),
    h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => { clips = INITIAL.map((c) => ({ ...c })); msg.textContent = 'Timeline reset.'; draw(); } } }, 'Reset'));
  root.addEventListener('keydown', (e) => { if (e.target.tagName === 'SELECT') return; if (e.key === ',' || e.key === '.') { e.preventDefault(); nudge((e.key === ',' ? -1 : 1) * (e.shiftKey ? 10 : 1)); } });
  const I = INITIAL; const same = (i) => clips[i].in === I[i].in && clips[i].out === I[i].out;
  const missions = missionPanel([
    { title: 'Ripple: tighten clip B', hint: 'Remove 12 frames from the END of clip B so the whole sequence gets 12 frames shorter. Reset first.', test: () => clips[1].out === I[1].out - 12 && clips[1].in === I[1].in && same(0) && same(2) },
    { title: 'Roll: move the A|B cut 8 frames later', hint: 'Select clip A and the Roll tool. A should get 8 frames longer and B 8 frames shorter, with the sequence length unchanged.', test: () => clips[0].out === I[0].out + 8 && clips[1].in === I[1].in + 8 && clips[1].out === I[1].out && same(2) && clips[0].in === I[0].in },
    { title: 'Slip: show a later part of B', hint: 'Slip B by +10 frames. It stays in the same place with the same length, but shows frames 58–129 of its source.', test: () => clips[1].in === I[1].in + 10 && clips[1].out === I[1].out + 10 && same(0) && same(2) },
    { title: 'Slide: move B 6 frames earlier', hint: 'Slide B by −6. A gets shorter, C reveals 6 more head frames, and B is untouched.', test: () => clips[0].out === I[0].out - 6 && clips[2].in === I[2].in - 6 && same(1) && clips[0].in === I[0].in && clips[2].out === I[2].out },
  ], { heading: 'Missions: trim like an Avid editor' });
  root.append(h('div', { class: 'ctl-row' }, toolSel.row, clipSel.row), desc, h('div', { class: 'canvas-wrap' }, cv), btns, msg, table, missions.el,
    h('p', { class: 'muted small' }, 'Keyboard: focus any button in the lab, then press , and . to nudge 1 frame, or Shift+, and Shift+. for 10 frames. Most editors trim with the same keys.'));
  draw();
}
