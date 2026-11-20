// Shared lab scaffolding: root element, XP on first use, control builders.
import { visitLab } from '../core/progress.js';
import { h, clear, toast } from '../core/ui.js';

export { h, clear, toast };

export function initLab(id) {
  const root = document.getElementById('lab-root');
  if (!root || root.dataset.lab !== id) return null;
  clear(root);
  let marked = false;
  const mark = async () => {
    if (marked) return;
    marked = true;
    try { if (await visitLab(id)) toast('+25 XP. New lab unlocked! 🧪', 'xp'); } catch { /* storage issues are non-fatal */ }
  };
  // Count a "use" on the first real interaction, not on page load.
  root.addEventListener('input', mark, { once: true });
  root.addEventListener('click', (e) => { if (e.target.closest('button, input, select, canvas')) mark(); });
  return root;
}

let uid = 0;
// Labelled range slider row: returns { row, input, value() }
export function slider({ label, min, max, step = 1, value, fmt = (v) => String(v), onInput }) {
  const id = `ctl-${++uid}`;
  const input = h('input', { type: 'range', id, min, max, step, value });
  const out = h('output', { for: id }, fmt(Number(value)));
  input.addEventListener('input', () => { out.textContent = fmt(Number(input.value)); onInput?.(Number(input.value)); });
  const row = h('div', { class: 'ctl' }, h('label', { for: id }, label), input, out);
  return { row, input, set(v) { input.value = v; out.textContent = fmt(Number(input.value)); }, get value() { return Number(input.value); } };
}

export function select({ label, options, value, onChange }) {
  const id = `ctl-${++uid}`;
  const sel = h('select', { id }, options.map(([v, t]) => h('option', { value: v }, t)));
  if (value != null) sel.value = value;
  sel.addEventListener('change', () => onChange?.(sel.value));
  return { row: h('div', { class: 'ctl-row' }, h('label', { for: id }, label), sel), el: sel };
}

export function numberInput({ label, value, min, max, step = 'any', onInput }) {
  const id = `ctl-${++uid}`;
  const el = h('input', { type: 'number', id, value, min, max, step, inputmode: 'decimal' });
  el.addEventListener('input', () => onInput?.(el.value));
  return { row: h('div', { class: 'ctl-row' }, h('label', { for: id }, label), el), el };
}

export function resultGrid(pairs) {
  return h('div', { class: 'result-grid' }, pairs.map(([k, v]) => h('div', {}, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v))));
}

// Request an animation frame at most once per frame for expensive redraws.
export function rafThrottle(fn) {
  let pending = false;
  return () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; fn(); }); };
}

export function fileButton(label, onFile) {
  const input = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif', 'aria-label': label });
  input.addEventListener('change', () => { const f = input.files && input.files[0]; if (f) onFile(f); input.value = ''; });
  return h('span', { class: 'btn btn-sm btn-ghost file-btn' }, label, input);
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(`Copied ${text}`); } catch { toast('Copy failed. Select the text and copy it manually.', 'err'); }
}

// Auto-checked challenges ("missions") that turn a lab into an interactive lesson.
// missions: [{ title, hint, test: () => boolean, setup?: () => void }]
export function missionPanel(missions, { heading = 'Missions' } = {}) {
  const done = new Set();
  const items = missions.map((m, i) => {
    const status = h('span', { class: 'mission-status', 'aria-hidden': 'true' }, '○');
    const btn = m.setup ? h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => { m.setup(); check(); } } }, 'Set up') : null;
    const li = h('li', { class: 'mission' }, status, h('div', {}, h('strong', {}, m.title), m.hint ? h('p', { class: 'muted small' }, m.hint) : null), btn);
    return { li, status, m, i };
  });
  const count = h('p', { class: 'muted small', role: 'status', 'aria-live': 'polite' });
  const el = h('section', { class: 'card missions' }, h('h2', { class: 'h4' }, `🎯 ${heading}`), h('ol', { class: 'mission-list' }, items.map((x) => x.li)), count);
  function check() {
    for (const it of items) {
      let ok = false;
      try { ok = !!it.m.test(); } catch { ok = false; }
      if (ok && !done.has(it.i)) { done.add(it.i); toast(`Mission complete: ${it.m.title} ✓`, 'xp'); }
      it.li.classList.toggle('done', done.has(it.i));
      it.status.textContent = done.has(it.i) ? '✓' : '○';
    }
    count.textContent = `${done.size}/${missions.length} missions complete${done.size === missions.length ? '. Lesson mastered! 🏆' : ''}`;
  }
  check();
  return { el, check };
}

export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
