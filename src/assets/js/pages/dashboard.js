import { currentUser } from '../core/auth.js';
import { loadProgress, computeStats, loadCourseMap, dayKey } from '../core/progress.js';
import { h, clear, fmtDate } from '../core/ui.js';

const root = document.getElementById('dashboard-root');
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function stat(k, v, sub) { return h('div', { class: 'stat' }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v), sub ? h('div', { class: 'muted small' }, sub) : null); }

async function render() {
  const user = await currentUser({ fresh: true });
  if (!user) { location.replace('/login/?next=' + encodeURIComponent('/dashboard/')); return; }
  const [map, p] = await Promise.all([loadCourseMap(), loadProgress()]);
  const s = computeStats(p, map);
  const all = map.weeks.flatMap((w) => w.lessons.map((l) => ({ ...l, week: w.n })));
  const nextLesson = all.find((l) => !has(p.lessons, l.id));

  const lvl = s.level;
  const h1 = document.getElementById('page-h1');
  if (h1) h1.textContent = `Hey ${user.name.split(' ')[0]} 👋`;
  const weekBars = map.weeks.map((w) => {
    const d = w.lessons.filter((l) => has(p.lessons, l.id)).length;
    const q = p.quizzes[String(w.n)];
    const fill = h('span', { class: 'bar-fill' });
    fill.style.width = `${Math.round((d / w.lessons.length) * 100)}%`;
    return h('div', { class: 'week-bar' },
      h('a', { href: w.path, title: w.title }, `W${String(w.n).padStart(2, '0')}`),
      h('div', { class: 'bar', title: `${d}/${w.lessons.length} lessons` }, fill),
      h('span', { class: 'small muted', title: 'Best quiz score' }, q ? `${Math.round((q.best / q.total) * 100)}%` : '–'),
    );
  });

  // Activity heatmap: last 90 days
  const heat = h('div', { class: 'heatmap', 'aria-label': 'Activity over the last 90 days' });
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const c = p.activity[dayKey(d)] || 0;
    heat.append(h('span', { class: c >= 6 ? 'l3' : c >= 3 ? 'l2' : c >= 1 ? 'l1' : '', title: `${dayKey(d)}: ${c} actions` }));
  }

  const notes = Object.entries(p.notes).sort((a, b) => b[1].at - a[1].at).slice(0, 5);
  const bookmarks = Object.keys(p.bookmarks).map((id) => all.find((l) => l.id === id)).filter(Boolean);

  const lvlFill = h('span');
  lvlFill.style.width = `${Math.round(lvl.pct * 100)}%`;

  clear(root).append(
    h('div', { class: 'dash-head' },
      h('div', {}, h('p', { class: 'muted' }, `Level ${lvl.level}: ${lvl.title}`, lvl.next ? ` · ${lvl.next - s.xp} XP to ${lvl.nextTitle}` : ' · Max level reached')),
      nextLesson ? h('a', { class: 'btn btn-lg', href: nextLesson.path }, `Continue: ${nextLesson.title} →`) : h('a', { class: 'btn btn-lg', href: '/certificate/' }, 'View certificate 🏆'),
    ),
    h('div', { class: 'level-bar', role: 'progressbar', 'aria-label': 'Level progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(lvl.pct * 100)) }, lvlFill),
    h('div', { class: 'dash-grid' },
      stat('Total XP', String(s.xp)),
      stat('Lessons', `${s.lessons}/${s.totalLessons}`, `${Math.round(s.pct * 100)}% complete`),
      stat('Quizzes passed', `${s.quizzesPassed}/${s.totalWeeks}`),
      stat('Streak', `${s.streak} 🔥`, `Best: ${s.bestStreak} days`),
    ),
    h('div', { class: 'dash-cols' },
      h('div', {},
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Progress by week'), h('div', { class: 'week-bars' }, weekBars)),
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Last 90 days'), heat),
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Recent notes'),
          notes.length ? h('ul', { class: 'note-list' }, notes.map(([id, n]) => {
            const l = all.find((x) => x.id === id);
            return h('li', {}, l ? h('a', { href: l.path }, l.title) : h('strong', {}, id), ' ', h('span', { class: 'muted small' }, fmtDate(n.at)), h('div', { class: 'snippet' }, n.text.slice(0, 220) + (n.text.length > 220 ? '…' : '')));
          })) : h('p', { class: 'muted' }, 'No notes yet. Every lesson has a notes box.')),
      ),
      h('div', {},
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, `Badges (${s.badges.filter((b) => b.earned).length}/${s.badges.length})`),
          h('div', { class: 'badges' }, s.badges.map((b) => h('div', { class: `badge ${b.earned ? '' : 'locked'}`, title: b.desc }, h('span', { class: 'bi', 'aria-hidden': 'true' }, b.icon), b.name, h('span', { class: 'sr-only' }, b.earned ? ' (earned)' : ` (locked: ${b.desc})`))))),
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Certificate'),
          s.certified ? h('div', {}, h('p', {}, 'You did it. All lessons complete and all quizzes passed.'), h('a', { class: 'btn btn-block', href: '/certificate/' }, 'Download certificate 🏆'))
            : h('div', {}, h('p', { class: 'muted' }, `Complete all ${s.totalLessons} lessons and pass all ${s.totalWeeks} quizzes (80%+) to unlock it.`), h('p', { class: 'small' }, `${s.totalLessons - s.lessons} lessons and ${s.totalWeeks - s.quizzesPassed} quizzes to go.`))),
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Bookmarks'),
          bookmarks.length ? h('ul', { class: 'link-list' }, bookmarks.map((l) => h('li', {}, h('a', { href: l.path }, `★ ${l.title}`)))) : h('p', { class: 'muted' }, 'Bookmark lessons to revisit them here.')),
        h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Quick links'), h('ul', { class: 'link-list' },
          h('li', {}, h('a', { href: '/planner/' }, '📅 90-Day Planner')), h('li', {}, h('a', { href: '/flashcards/' }, '🃏 Flashcards')), h('li', {}, h('a', { href: '/labs/' }, `🧪 Labs (${s.labs}/${s.totalLabs} used)`)), h('li', {}, h('a', { href: '/playbook/' }, '🛠️ Scenario Playbook')))),
      ),
    ),
  );
}

render().catch(() => { clear(root).append(h('p', { class: 'form-error' }, 'Could not load your dashboard. Please refresh.')); });
addEventListener('hc:progress', () => render().catch(() => {}));
