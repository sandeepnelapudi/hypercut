// Global site behaviour: theme, navigation, header account menu, keyboard shortcuts.
import { currentUser, logout } from './core/auth.js';
import { loadProgress, computeStats, loadCourseMap } from './core/progress.js';
import { h, clear, toast } from './core/ui.js';
import { getDB } from './core/db.js';

// Theme toggle
const themeBtn = document.getElementById('theme-toggle');
themeBtn?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', cur);
  try { localStorage.setItem('hc:v1~theme', cur); } catch { /* ignore */ }
});

// Mobile nav
const navBtn = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
navBtn?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav?.classList.contains('open')) { nav.classList.remove('open'); navBtn.setAttribute('aria-expanded', 'false'); navBtn.focus(); }
  // "/" opens search unless typing
  const tag = (e.target && e.target.tagName) || '';
  if (e.key === '/' && !e.ctrlKey && !e.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(tag) && !e.target.isContentEditable) {
    if (location.pathname !== '/search/') { e.preventDefault(); location.href = '/search/'; }
  }
});

// Header account area
async function renderAuthSlot() {
  const slot = document.getElementById('auth-slot');
  if (!slot) return;
  let user = null;
  try { user = await currentUser({ fresh: true }); } catch { user = null; }
  if (!user) {
    clear(slot).append(
      h('a', { class: 'btn btn-sm btn-ghost', href: '/login/?next=' + encodeURIComponent(location.pathname) }, 'Log in'),
      h('a', { class: 'btn btn-sm', href: '/signup/' }, 'Start free'),
    );
    return;
  }
  let xpText = '';
  try { const map = await loadCourseMap(); const s = computeStats(await loadProgress(), map); xpText = `${s.xp} XP`; } catch { /* offline map */ }
  const initials = user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const list = h('ul', { class: 'user-menu-list', id: 'user-menu-list', hidden: true, role: 'menu' },
    h('li', { role: 'none' }, h('a', { href: '/dashboard/', role: 'menuitem' }, 'Dashboard')),
    h('li', { role: 'none' }, h('a', { href: '/planner/', role: 'menuitem' }, '90-Day Planner')),
    h('li', { role: 'none' }, h('a', { href: '/flashcards/', role: 'menuitem' }, 'Flashcards')),
    h('li', { role: 'none' }, h('a', { href: '/account/', role: 'menuitem' }, 'Account settings')),
    h('li', { role: 'none' }, h('button', { type: 'button', role: 'menuitem', on: { click: async () => { await logout(); toast('Logged out. See you tomorrow.'); setTimeout(() => location.assign('/'), 400); } } }, 'Log out')),
  );
  const btn = h('button', { class: 'user-chip', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'user-menu-list' },
    h('span', { class: 'avatar', 'aria-hidden': 'true' }, initials || '?'),
    h('span', { class: 'uname' }, user.name.split(' ')[0]),
    xpText ? h('span', { class: 'xp-pill' }, xpText) : null,
  );
  const close = () => { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); const open = list.hidden; list.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open) list.querySelector('a')?.focus(); });
  document.addEventListener('click', (e) => { if (!list.contains(e.target)) close(); });
  list.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); btn.focus(); } });
  clear(slot).append(h('div', { class: 'user-menu' }, btn, list));
}

renderAuthSlot();
addEventListener('hc:auth', renderAuthSlot);
// Cross-tab: if login state changes in another tab, refresh header.
addEventListener('storage', (e) => { if (e.key && (e.key.startsWith('hc:v1~session') || e.key.startsWith('hc:v1:sessions'))) renderAuthSlot(); });

// Warn once if storage isn't persistent (private mode / blocked).
if (!getDB().persistent) {
  setTimeout(() => toast('Your browser is blocking storage, so progress will not be saved after you close this tab.', 'err', 7000), 800);
}

// Home: show progress if logged in
(async () => {
  const hp = document.getElementById('hero-progress');
  const cp = document.getElementById('curriculum-progress');
  const cards = document.querySelectorAll('[data-week-fill]');
  if (!hp && !cp && !cards.length) return;
  try {
    const [user, map] = await Promise.all([currentUser(), loadCourseMap()]);
    const p = await loadProgress();
    const s = computeStats(p, map);
    for (const el of document.querySelectorAll('.lesson-mini li[data-lesson]')) el.classList.toggle('done', Object.prototype.hasOwnProperty.call(p.lessons, el.dataset.lesson));
    for (const el of cards) {
      const w = map.weeks.find((x) => String(x.n) === el.dataset.weekFill);
      if (!w) continue;
      const d = w.lessons.filter((l) => Object.prototype.hasOwnProperty.call(p.lessons, l.id)).length;
      el.style.width = `${Math.round((d / w.lessons.length) * 100)}%`;
    }
    if (s.lessons > 0) {
      const txt = `${user ? user.name.split(' ')[0] + ', you' : 'You'}'ve completed ${s.lessons}/${s.totalLessons} lessons (${Math.round(s.pct * 100)}%). Level ${s.level.level}: ${s.level.title}.`;
      if (hp) { hp.hidden = false; hp.querySelector('.hero-progress-text').textContent = txt; }
      if (cp) { cp.hidden = false; clear(cp).append(h('p', { class: 'muted' }, txt, ' ', h('a', { href: '/dashboard/' }, 'Open dashboard →'))); }
    }
  } catch { /* non-critical */ }
})();

// Mark visited labs on labs index
(async () => {
  const cards = document.querySelectorAll('[data-lab-card]');
  if (!cards.length) return;
  try { const p = await loadProgress(); cards.forEach((c) => { if (Object.prototype.hasOwnProperty.call(p.labs, c.dataset.labCard)) { c.classList.add('visited'); c.setAttribute('title', 'You have used this lab'); } }); } catch { /* ignore */ }
})();
