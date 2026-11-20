import { loadProgress, togglePlanDay } from '../core/progress.js';
import { currentUser } from '../core/auth.js';
import { h, clear, toast } from '../core/ui.js';

const root = document.getElementById('planner-root');
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
let plan = [];

// A day counts as done if ticked, or its lesson/quiz/project is complete.
function autoDone(d, p) {
  if (d.type === 'lesson') return has(p.lessons, d.id);
  if (d.type === 'lab') { const q = p.quizzes[String(d.week)]; return !!q && q.best / q.total >= 0.8; }
  if (d.type === 'project') return has(p.projects, d.id.replace('project-', ''));
  return false;
}

async function render() {
  const [p, user] = await Promise.all([loadProgress(), currentUser()]);
  const done = (d) => has(p.plan, String(d.day)) || autoDone(d, p);
  const doneCount = plan.filter(done).length;
  const today = plan.find((d) => !done(d));
  const weeks = [...new Set(plan.map((d) => d.week))];
  clear(root).append(
    h('div', { class: 'card' },
      h('p', {}, h('strong', {}, `${doneCount}/90 days complete. `), today ? ['Next up: ', h('a', { href: today.href }, `Day ${today.day}: ${today.title}`)] : 'Every day is complete. Legendary.'),
      user ? null : h('p', { class: 'muted small' }, 'Progress is saved on this device. ', h('a', { href: '/signup/' }, 'Create an account'), ' to keep it.'),
    ),
    h('div', { class: 'plan-weeks' }, weeks.map((wn) => h('section', { class: 'card plan-week' },
      h('h2', {}, wn === 13 ? 'Days 85–90: Capstone' : `Week ${wn}`),
      h('div', { class: 'plan-days' }, plan.filter((d) => d.week === wn).map((d) => {
        const isDone = done(d);
        const cb = h('input', { type: 'checkbox', id: `day-${d.day}`, 'aria-label': `Mark day ${d.day} done` });
        cb.checked = isDone;
        cb.disabled = autoDone(d, p);
        cb.addEventListener('change', async () => {
          try { await togglePlanDay(d.day); if (cb.checked) toast(`Day ${d.day} done! +10 XP`, 'xp'); render(); } catch (e) { toast(e.message, 'err'); cb.checked = !cb.checked; }
        });
        return h('div', { class: `plan-day type-${d.type} ${isDone ? 'done' : ''} ${today === d ? 'today' : ''}` },
          cb, h('label', { for: `day-${d.day}` }, h('span', { class: 'dnum' }, `Day ${d.day}`), h('a', { href: d.href }, d.title)));
      })),
    ))),
  );
}

fetch('/plan.json', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { if (Array.isArray(j)) plan = j; return render(); })
  .catch(() => { root.append(h('p', { class: 'form-error' }, 'Could not load the plan.')); });
