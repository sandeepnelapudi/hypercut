const os = document.getElementById('sw-os');
const sort = document.getElementById('sw-sort');
const tbody = document.querySelector('#sw-table tbody');
const cards = [...document.querySelectorAll('.software')];
const grid = document.querySelector('.software-grid');

function apply() {
  const want = os.value;
  const key = sort.value;
  const rows = [...tbody.rows];
  const okKey = /^[a-z]+$/.test(key) ? key : 'name';
  rows.sort((a, b) => (okKey === 'name' ? a.cells[0].textContent.localeCompare(b.cells[0].textContent) : Number(b.dataset[okKey]) - Number(a.dataset[okKey])));
  for (const r of rows) { r.hidden = want !== 'all' && !r.dataset.os.split('|').includes(want); tbody.append(r); }
  const order = rows.map((r) => r.dataset.id);
  cards.sort((a, b) => order.indexOf(a.id.slice(3)) - order.indexOf(b.id.slice(3)));
  for (const c of cards) { c.hidden = want !== 'all' && !c.dataset.os.split('|').includes(want); grid.append(c); }
}
os?.addEventListener('change', apply);
sort?.addEventListener('change', apply);
