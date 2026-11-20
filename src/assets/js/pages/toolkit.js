import { inKit } from '../core/kit.js';
import { loadProgress, toggleKit } from '../core/progress.js';
import { toast } from '../core/ui.js';

const budget = document.getElementById('kit-budget');
const focus = document.getElementById('kit-focus');
const all = document.getElementById('kit-all');
const summary = document.getElementById('kit-summary');
const cards = [...document.querySelectorAll('.tool-card')];
const cats = [...document.querySelectorAll('.tool-cat')];
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
let owned = {};

function apply() {
  let shown = 0, have = 0, free = 0;
  for (const c of cards) {
    const t = { tier: c.dataset.tier, price: c.dataset.price, focus: (c.dataset.focus || '').split(' ') };
    const show = all.checked || inKit(t, budget.value, focus.value);
    c.hidden = !show;
    c.classList.toggle('owned', has(owned, c.dataset.tool));
    if (show) { shown++; if (has(owned, c.dataset.tool)) have++; if (t.price === 'free') free++; }
  }
  for (const s of cats) s.hidden = [...s.querySelectorAll('.tool-card')].every((c) => c.hidden);
  summary.textContent = `${shown} tools in your kit (${free} free). You already have ${have}. ${shown - have > 0 ? `${shown - have} to go.` : 'Kit complete! 🎉'}`;
}

for (const el of [budget, focus, all]) el?.addEventListener('change', apply);
document.querySelectorAll('[data-have]').forEach((cb) => cb.addEventListener('change', async () => {
  try { const on = await toggleKit(cb.dataset.have); if (on) owned[cb.dataset.have] = Date.now(); else delete owned[cb.dataset.have]; apply(); } catch (e) { cb.checked = !cb.checked; toast(e.message || 'Could not save.', 'err'); }
}));
(async () => {
  try { owned = (await loadProgress()).kit || {}; document.querySelectorAll('[data-have]').forEach((cb) => { cb.checked = has(owned, cb.dataset.have); }); } catch { owned = {}; }
  apply();
  const id = decodeURIComponent(location.hash.slice(1));
  if (/^tool-[a-z0-9-]{1,40}$/.test(id)) { const el = document.getElementById(id); if (el) { all.checked = true; apply(); el.scrollIntoView({ block: 'start' }); } }
})();
