import { h, clear, highlight, debounce } from '../core/ui.js';
import { qs } from './_shared.js';

const input = document.getElementById('q');
const out = document.getElementById('search-results');
const count = document.getElementById('search-count');
let index = [];

export function tokenize(q) {
  return String(q || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s.-]/gu, ' ').split(/\s+/).filter((t) => t.length > 1).slice(0, 8);
}

export function score(doc, terms) {
  const t = doc.t.toLowerCase(), s = doc.s.toLowerCase(), b = doc.b.toLowerCase();
  let total = 0;
  for (const term of terms) {
    let hit = 0;
    if (t.includes(term)) hit += t.startsWith(term) ? 12 : 8;
    if (s.includes(term)) hit += 4;
    if (b.includes(term)) hit += 1 + Math.min(3, b.split(term).length - 2);
    if (!hit) return 0; // AND semantics
    total += hit;
  }
  return total;
}

function run() {
  const q = input.value.slice(0, 100);
  const terms = tokenize(q);
  clear(out);
  if (!terms.length) { count.textContent = q ? 'Type at least 2 characters.' : ''; return; }
  const res = index.map((d) => [score(d, terms), d]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 50);
  count.textContent = res.length ? `${res.length}${res.length === 50 ? '+' : ''} result${res.length === 1 ? '' : 's'} for “${q}”` : `No results for “${q}”. Try another word, or browse the playbook.`;
  for (const [, d] of res) {
    out.append(h('li', {}, h('span', { class: 'kind' }, d.k), h('a', { href: d.u }, highlight(d.t, terms)), h('p', { class: 'muted small' }, highlight(d.s.slice(0, 200), terms))));
  }
  try { history.replaceState(null, '', q ? `?q=${encodeURIComponent(q)}` : location.pathname); } catch { /* ignore */ }
}

if (input) {
  input.value = (qs('q') || '').slice(0, 100);
  input.focus();
  input.addEventListener('input', debounce(run, 120));
  input.form?.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  fetch('/search-index.json', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { index = Array.isArray(j) ? j.filter((d) => d && typeof d.t === 'string' && typeof d.u === 'string' && d.u.startsWith('/')) : []; run(); })
    .catch(() => { count.textContent = 'Search index failed to load.'; });
}
