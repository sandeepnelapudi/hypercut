import { initLab, h, clear, toast, download } from './_lab.js';
import { toCSV } from './lib2.js';
import { getDB } from '../core/db.js';
import { currentUser } from '../core/auth.js';

const SIZES = ['EWS', 'WS', 'MWS', 'MS', 'MCU', 'CU', 'ECU', 'Insert', 'OTS', 'POV'];
const ANGLES = ['Eye level', 'Low', 'High', 'Dutch', 'Overhead'];
const MOVES = ['Static', 'Pan', 'Tilt', 'Dolly in', 'Dolly out', 'Truck', 'Handheld', 'Gimbal', 'Crane/drone', 'Zoom'];
const MAX_ROWS = 300;
const FIELDS = ['scene', 'shot', 'size', 'angle', 'move', 'lens', 'desc', 'dur', 'done'];

function clean(r) {
  const s = (v, n) => String(v ?? '').slice(0, n);
  return { scene: s(r.scene, 20), shot: s(r.shot, 20), size: SIZES.includes(r.size) ? r.size : 'MS', angle: ANGLES.includes(r.angle) ? r.angle : 'Eye level', move: MOVES.includes(r.move) ? r.move : 'Static', lens: s(r.lens, 12), desc: s(r.desc, 300), dur: Math.max(0, Math.min(3600, Number(r.dur) || 0)), done: !!r.done };
}

const root = initLab('shot-list');
if (root) {
  let rows = [];
  let key = 'shotlist-guest';
  const status = h('p', { class: 'muted small', role: 'status', 'aria-live': 'polite' });
  const body = h('tbody');
  const totals = h('p');
  let timer = null;
  const flush = () => {
    clearTimeout(timer); timer = null;
    getDB().put('tools', key, { v: 1, rows }).then(() => { status.textContent = 'Saved ✓'; }, (e) => { status.textContent = e.message || 'Could not save.'; });
  };
  const save = () => { status.textContent = 'Saving…'; clearTimeout(timer); timer = setTimeout(flush, 400); };
  // Never lose the last edit if the tab is closed or reloaded quickly.
  addEventListener('pagehide', () => { if (timer) flush(); });
  function render() {
    clear(body);
    rows.forEach((r, i) => {
      const cell = (el) => h('td', {}, el);
      const txt = (f, w, max) => { const el = h('input', { type: 'text', value: r[f], maxlength: String(max), 'aria-label': `${f} for row ${i + 1}`, style: { width: w } }); el.addEventListener('input', () => { r[f] = el.value.slice(0, max); save(); }); return el; };
      const sel = (f, opts) => { const el = h('select', { 'aria-label': `${f} for row ${i + 1}` }, opts.map((o) => h('option', { value: o }, o))); el.value = r[f]; el.addEventListener('change', () => { r[f] = el.value; save(); }); return el; };
      const dur = h('input', { type: 'number', min: '0', max: '3600', step: '0.5', value: String(r.dur), 'aria-label': `Duration for row ${i + 1}`, style: { width: '70px' } });
      dur.addEventListener('input', () => { r.dur = Math.max(0, Math.min(3600, Number(dur.value) || 0)); updateTotals(); save(); });
      const done = h('input', { type: 'checkbox', 'aria-label': `Shot ${i + 1} captured` }); done.checked = r.done;
      done.addEventListener('change', () => { r.done = done.checked; updateTotals(); save(); });
      const move = (d) => { const j = i + d; if (j < 0 || j >= rows.length) return; [rows[i], rows[j]] = [rows[j], rows[i]]; render(); save(); };
      body.append(h('tr', {}, cell(done), cell(txt('scene', '56px', 20)), cell(txt('shot', '56px', 20)), cell(sel('size', SIZES)), cell(sel('angle', ANGLES)), cell(sel('move', MOVES)), cell(txt('lens', '64px', 12)), cell(txt('desc', '220px', 300)), cell(dur),
        cell(h('div', { class: 'row-gap' }, h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': `Move row ${i + 1} up`, on: { click: () => move(-1) } }, '↑'), h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': `Move row ${i + 1} down`, on: { click: () => move(1) } }, '↓'),
          h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': `Delete row ${i + 1}`, on: { click: () => { rows.splice(i, 1); render(); save(); } } }, '✕')))));
    });
    updateTotals();
  }
  function updateTotals() {
    const t = rows.reduce((a, r) => a + r.dur, 0);
    totals.textContent = `${rows.length} shots · ${rows.filter((r) => r.done).length} captured · planned screen time ${Math.floor(t / 60)}m ${Math.round(t % 60)}s`;
  }
  const add = h('button', { class: 'btn btn-sm', type: 'button', on: { click: () => {
    if (rows.length >= MAX_ROWS) { toast(`Maximum ${MAX_ROWS} shots.`, 'err'); return; }
    const last = rows[rows.length - 1];
    rows.push(clean({ scene: last?.scene || '1', shot: String((Number(last?.shot) || 0) + 1), size: 'MS', dur: 3 })); render(); save();
  } } }, '+ Add shot');
  const exp = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => {
    download('shot-list.csv', toCSV([['Done', 'Scene', 'Shot', 'Size', 'Angle', 'Movement', 'Lens', 'Description', 'Duration (s)'], ...rows.map((r) => [r.done ? 'yes' : '', r.scene, r.shot, r.size, r.angle, r.move, r.lens, r.desc, r.dur])]), 'text/csv');
  } } }, 'Export CSV');
  const print = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => window.print() } }, 'Print');
  const clearAll = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => { if (rows.length && confirm('Delete all shots?')) { rows = []; render(); save(); } } } }, 'Clear');
  const sample = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => {
    rows = [['1', '1', 'WS', 'Eye level', 'Static', '24mm', 'Kitchen at dawn, establish the space', 4], ['1', '2', 'MS', 'Eye level', 'Handheld', '35mm', 'She fills the kettle', 3], ['1', '3', 'Insert', 'High', 'Static', '85mm', 'Coffee grounds into the filter', 2], ['1', '4', 'CU', 'Low', 'Dolly in', '50mm', 'Her face as she reads the letter', 5], ['1', '5', 'ECU', 'Eye level', 'Static', '100mm', 'Tear on the page', 2]]
      .map(([scene, shot, size, angle, move, lens, desc, dur]) => clean({ scene, shot, size, angle, move, lens, desc, dur }));
    render(); save();
  } } }, 'Load example');
  root.append(h('div', { class: 'ctl-row' }, add, sample, exp, print, clearAll), status,
    h('div', { class: 'table-wrap' }, h('table', { class: 'data-table' }, h('thead', {}, h('tr', {}, ['✓', 'Scene', 'Shot', 'Size', 'Angle', 'Move', 'Lens', 'Description', 'Secs', ''].map((t) => h('th', { scope: 'col' }, t)))), body)), totals,
    h('p', { class: 'muted small' }, 'Plan your coverage before the shoot: wide for geography, mediums for performance, close-ups for emotion, inserts for rhythm. Your list is saved to your account on this device.'));
  (async () => {
    try {
      const u = await currentUser();
      key = `shotlist-${u ? u.id : 'guest'}`;
      const saved = await getDB().get('tools', key);
      rows = Array.isArray(saved?.rows) ? saved.rows.slice(0, MAX_ROWS).map(clean) : [];
      status.textContent = u ? 'Stored with your account on this device.' : 'Stored on this device. Log in to keep it with your account.';
    } catch { rows = []; }
    render();
  })();
}

export { FIELDS };
