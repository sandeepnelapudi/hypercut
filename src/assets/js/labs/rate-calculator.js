import { initLab, h, numberInput, select, clear, resultGrid } from './_lab.js';
import { rateCalc, projectQuote, PROJECT_TYPES } from './lib2.js';

const root = initLab('rate-calculator');
if (root) {
  const st = { cur: '$', income: 50000, expenses: 5000, weeksOff: 6, days: 5, util: 60, tax: 25, type: 'youtube', minutes: 10, revisions: 2, color: false, sound: false };
  const out = h('div'), quote = h('div');
  const money = (v) => `${st.cur}${Math.round(v).toLocaleString()}`;
  function update() {
    let r;
    try { r = rateCalc({ income: st.income, expenses: st.expenses, weeksOff: st.weeksOff, daysPerWeek: st.days, utilization: st.util / 100, taxRate: st.tax / 100 }); } catch (e) { clear(out).append(h('p', { class: 'form-error' }, e.message)); return; }
    clear(out).append(resultGrid([['Day rate', money(r.dayRate)], ['Hourly rate', money(r.hourRate)], ['Billable days / year', r.billableDays.toFixed(0)], ['Gross revenue needed', money(r.grossNeeded)]]),
      h('p', { class: 'muted small' }, 'Utilisation is the share of working days that are actually paid. New freelancers often reach only 40–60%. The rest goes on admin, pitching, learning and gaps between jobs.'));
    try {
      const q = projectQuote({ type: st.type, minutes: st.minutes, dayRate: r.dayRate, revisions: st.revisions, color: st.color, sound: st.sound });
      clear(quote).append(resultGrid([['Estimated hours', q.hours.toFixed(1)], ['Days', q.days.toFixed(1)], ['Suggested quote', money(q.price)], ['Deposit (40%)', money(q.price * 0.4)]]),
        h('p', { class: 'muted small' }, `Based on about ${PROJECT_TYPES[st.type].hpm} editing hours per finished minute, a rough industry rule of thumb. Track your own hours on 3–5 projects and replace this with your real numbers.`));
    } catch (e) { clear(quote).append(h('p', { class: 'form-error' }, e.message)); }
  }
  const n = (label, key, min, max, step = 1) => numberInput({ label, value: st[key], min, max, step, onInput: (v) => { const x = Number(v); if (Number.isFinite(x) && x >= min && x <= max) { st[key] = x; update(); } } }).row;
  const cur = select({ label: 'Currency', value: st.cur, options: [['$', '$'], ['€', '€'], ['£', '£'], ['₹', '₹'], ['A$', 'A$'], ['C$', 'C$']], onChange: (v) => { st.cur = v; update(); } });
  const type = select({ label: 'Project type', value: st.type, options: Object.entries(PROJECT_TYPES).map(([k, v]) => [k, v.name]), onChange: (v) => { st.type = v; update(); } });
  const cb = (label, key) => { const i = h('input', { type: 'checkbox', id: `rc-${key}` }); i.addEventListener('change', () => { st[key] = i.checked; update(); }); return h('label', { for: `rc-${key}` }, i, ` ${label}`); };
  root.append(h('h2', { class: 'h4' }, 'Your rate'), h('div', { class: 'ctl-row' }, cur.row, n('Take-home goal / year', 'income', 0, 100000000, 1000), n('Business expenses / year', 'expenses', 0, 10000000, 100)),
    h('div', { class: 'ctl-row' }, n('Weeks off', 'weeksOff', 0, 51), n('Work days / week', 'days', 1, 7), n('Utilisation %', 'util', 5, 100), n('Tax %', 'tax', 0, 90)), out,
    h('h2', { class: 'h4' }, 'Project quote'), h('div', { class: 'ctl-row' }, type.row, n('Finished minutes', 'minutes', 0.1, 600, 0.1), n('Revision rounds', 'revisions', 0, 10)),
    h('div', { class: 'ctl-row' }, cb('Includes color grade', 'color'), cb('Includes sound mix', 'sound')), quote,
    h('p', { class: 'callout tip' }, 'Always quote with a scope: deliverables, length, formats, number of revision rounds, the price of extra rounds, the timeline, and who licenses the music. See Week 12, "The Business".'));
  update();
}
