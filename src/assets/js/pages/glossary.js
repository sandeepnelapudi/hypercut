import { debounce } from '../core/ui.js';

const input = document.getElementById('gl-search');
const items = [...document.querySelectorAll('.gl-item')];
const groups = [...document.querySelectorAll('.gl-group')];
input?.addEventListener('input', debounce(() => {
  const q = input.value.trim().toLowerCase();
  for (const it of items) it.hidden = q.length > 0 && !it.textContent.toLowerCase().includes(q);
  for (const g of groups) g.hidden = [...g.querySelectorAll('.gl-item')].every((i) => i.hidden);
}, 80));
