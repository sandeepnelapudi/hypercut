import { debounce } from '../core/ui.js';

const input = document.getElementById('pb-search');
const chips = [...document.querySelectorAll('.chip[data-cat]')];
const items = [...document.querySelectorAll('.scenario')];
const count = document.getElementById('pb-count');
let cat = 'all';

function apply() {
  const terms = (input.value || '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  let n = 0;
  for (const it of items) {
    const okCat = cat === 'all' || it.dataset.cat === cat;
    const txt = it.dataset.text || '';
    const okText = terms.every((t) => txt.includes(t));
    const show = okCat && okText;
    it.hidden = !show;
    if (show) n++;
  }
  count.textContent = `${n} of ${items.length} scenarios`;
  if (terms.length && n > 0 && n <= 3) items.filter((i) => !i.hidden).forEach((i) => { i.open = true; });
}

chips.forEach((c) => c.addEventListener('click', () => {
  cat = c.dataset.cat;
  chips.forEach((x) => { const on = x === c; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
  apply();
}));
input?.addEventListener('input', debounce(apply, 100));

// Open the scenario targeted by the URL hash.
function openHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!/^[a-z0-9-]{1,60}$/.test(id)) return;
  const el = document.getElementById(id);
  if (el && el.classList.contains('scenario')) { el.hidden = false; el.open = true; el.scrollIntoView({ block: 'start' }); }
}
addEventListener('hashchange', openHash);
apply();
openHash();
