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
