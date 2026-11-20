// Learning progress: per-user (or guest) document in the "progress" collection.
// XP, levels, streaks and badges are DERIVED from progress, never stored, so they
// can't drift out of sync.
import { getDB } from './db.js';
import { currentUser } from './auth.js';

export const GUEST_ID = 'guest';
const ID_RE_RAW = /^[a-z0-9-]{1,40}$/;
const RESERVED = new Set(['constructor', 'prototype', '__proto__', 'hasownproperty', 'tostring', 'valueof']);
const ID_RE = { test: (k) => ID_RE_RAW.test(k) && !RESERVED.has(k) };
export const NOTE_MAX = 5000;
export const QUIZ_PASS = 0.8;
const has = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);

export function emptyProgress() {
  return { v: 1, lessons: {}, quizzes: {}, notes: {}, bookmarks: {}, labs: {}, projects: {}, plan: {}, kit: {}, cards: {}, activity: {}, updatedAt: 0 };
}

// Coerce whatever is in storage into a well-formed progress object.
export function sanitiseProgress(raw) {
  const p = emptyProgress();
  if (!raw || typeof raw !== 'object') return p;
  const mapTs = (src, dst) => { if (src && typeof src === 'object') for (const [k, v] of Object.entries(src)) if (ID_RE.test(k) && Number.isFinite(v)) dst[k] = v; };
  mapTs(raw.lessons, p.lessons); mapTs(raw.bookmarks, p.bookmarks); mapTs(raw.labs, p.labs); mapTs(raw.projects, p.projects); mapTs(raw.plan, p.plan); mapTs(raw.kit, p.kit);
  if (raw.quizzes && typeof raw.quizzes === 'object') for (const [k, q] of Object.entries(raw.quizzes)) {
    if (ID_RE.test(k) && q && Number.isFinite(q.best) && Number.isFinite(q.total) && q.total > 0) p.quizzes[k] = { best: Math.max(0, Math.min(q.best, q.total)), total: q.total, at: Number(q.at) || 0 };
  }
  if (raw.notes && typeof raw.notes === 'object') for (const [k, n] of Object.entries(raw.notes)) {
    if (ID_RE.test(k) && n && typeof n.text === 'string') p.notes[k] = { text: n.text.slice(0, NOTE_MAX), at: Number(n.at) || 0 };
  }
  if (raw.cards && typeof raw.cards === 'object') for (const [k, c] of Object.entries(raw.cards)) {
    if (ID_RE.test(k) && c && Number.isFinite(c.box)) p.cards[k] = { box: Math.max(1, Math.min(5, Math.trunc(c.box))), due: Number(c.due) || 0, seen: Number(c.seen) || 0 };
  }
  if (raw.activity && typeof raw.activity === 'object') for (const [k, v] of Object.entries(raw.activity)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(v)) p.activity[k] = Math.max(0, Math.min(v, 1000));
  }
  p.updatedAt = Number(raw.updatedAt) || 0;
  return p;
}

export function dayKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

async function ownerId() {
  const u = await currentUser();
  return u ? u.id : GUEST_ID;
}

export async function loadProgress(owner) {
  const id = owner ?? (await ownerId());
  return sanitiseProgress(await getDB().get('progress', id));
}

// Serialise writes so rapid clicks can't clobber each other.
let chain = Promise.resolve();
export function updateProgress(mutator, { activity = true, owner } = {}) {
  const run = async () => {
    const id = owner ?? (await ownerId());
    const p = await loadProgress(id);
    const result = mutator(p);
    if (activity) { const k = dayKey(); p.activity[k] = (p.activity[k] || 0) + 1; }
    p.updatedAt = Date.now();
    await getDB().put('progress', id, p);
    try { globalThis.dispatchEvent?.(new CustomEvent('hc:progress', { detail: { owner: id } })); } catch { /* ignore */ }
    return result;
  };
  const next = chain.then(run, run);
  chain = next.catch(() => {});
  return next;
}

const checkId = (id) => { if (typeof id !== 'string' || !ID_RE.test(id)) throw new Error('Invalid id'); return id; };

export const setLessonComplete = (id, done = true) => updateProgress((p) => { checkId(id); if (done) p.lessons[id] = Date.now(); else delete p.lessons[id]; return done; }, { activity: done });
export const toggleBookmark = (id) => updateProgress((p) => { checkId(id); if (has(p.bookmarks, id)) { delete p.bookmarks[id]; return false; } p.bookmarks[id] = Date.now(); return true; }, { activity: false });
export const visitLab = (id) => updateProgress((p) => { checkId(id); const first = !has(p.labs, id); if (first) p.labs[id] = Date.now(); return first; });
export const toggleProject = (id) => updateProgress((p) => { checkId(id); if (has(p.projects, id)) { delete p.projects[id]; return false; } p.projects[id] = Date.now(); return true; });
export const toggleKit = (id) => updateProgress((p) => { checkId(id); if (has(p.kit, id)) { delete p.kit[id]; return false; } p.kit[id] = Date.now(); return true; }, { activity: false });
export const togglePlanDay = (day) => updateProgress((p) => { const k = String(day); checkId(k); if (has(p.plan, k)) { delete p.plan[k]; return false; } p.plan[k] = Date.now(); return true; });
export function saveNote(id, text) {
  return updateProgress((p) => {
    checkId(id);
    const t = String(text ?? '').slice(0, NOTE_MAX);
    if (t.trim()) p.notes[id] = { text: t, at: Date.now() }; else delete p.notes[id];
    return true;
  }, { activity: false });
}
export function recordQuiz(week, score, total) {
  return updateProgress((p) => {
    const k = checkId(String(week));
    if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) throw new Error('Invalid score');
    const prev = p.quizzes[k];
    const improved = !prev || score > prev.best;
    if (improved) p.quizzes[k] = { best: score, total, at: Date.now() };
    return { improved, best: improved ? score : prev.best, passed: (improved ? score : prev.best) / total >= QUIZ_PASS };
  });
}
export function reviewCard(id, knew) {
  return updateProgress((p) => {
    checkId(id);
    const c = p.cards[id] || { box: 1, due: 0, seen: 0 };
    c.box = knew ? Math.min(5, c.box + 1) : 1;
    c.seen += 1;
    const days = [0, 1, 2, 4, 8, 16][c.box];
    c.due = Date.now() + days * 86400000 - 3600000; // an hour early so "tomorrow" means tomorrow
    p.cards[id] = c;
    return c;
  });
}

// Merge guest progress into an account (union; keeps best quiz scores and longer notes).
export function mergeProgress(a, b) {
  const out = sanitiseProgress(a);
  const src = sanitiseProgress(b);
  for (const key of ['lessons', 'bookmarks', 'labs', 'projects', 'plan', 'kit']) for (const [k, v] of Object.entries(src[key])) if (!has(out[key], k)) out[key][k] = v;
  for (const [k, q] of Object.entries(src.quizzes)) if (!has(out.quizzes, k) || q.best / q.total > out.quizzes[k].best / out.quizzes[k].total) out.quizzes[k] = q;
  for (const [k, n] of Object.entries(src.notes)) if (!has(out.notes, k)) out.notes[k] = n; else if (n.text !== out.notes[k].text) out.notes[k] = { text: (out.notes[k].text + '\n\n' + n.text).slice(0, NOTE_MAX), at: Math.max(n.at, out.notes[k].at) };
  for (const [k, c] of Object.entries(src.cards)) if (!has(out.cards, k) || c.box > out.cards[k].box) out.cards[k] = c;
  for (const [k, v] of Object.entries(src.activity)) out.activity[k] = Math.min(1000, (out.activity[k] || 0) + v);
  out.updatedAt = Date.now();
  return out;
}

export async function migrateGuestTo(userId) {
  const db = getDB();
  // Carry over a guest shot list if the account doesn't have one yet.
  const gs = await db.get('tools', 'shotlist-guest');
  if (gs && !(await db.get('tools', `shotlist-${userId}`))) { await db.put('tools', `shotlist-${userId}`, gs); await db.delete('tools', 'shotlist-guest'); }
  const guest = await db.get('progress', GUEST_ID);
  if (!guest) return false;
  const mine = await db.get('progress', userId);
  await db.put('progress', userId, mergeProgress(mine, guest));
  await db.delete('progress', GUEST_ID);
  return true;
}

// ---------- derived stats ----------
export const LEVELS = [
  [0, 'Intern'], [300, 'Assistant Editor'], [900, 'Editor'], [1800, 'Senior Editor'], [3000, 'Colorist'],
  [4500, 'Supervising Editor'], [6500, 'Post Supervisor'], [9000, 'Edit Legend'], [12000, 'Edit God'],
];

export function computeXP(p) {
  let xp = Object.keys(p.lessons).length * 50;
  for (const q of Object.values(p.quizzes)) { xp += q.best * 10; if (q.best / q.total >= QUIZ_PASS) xp += 100; }
  xp += Object.keys(p.labs).length * 25;
  xp += Object.keys(p.projects).length * 250;
  xp += Object.keys(p.plan).length * 10;
  xp += Object.values(p.cards).reduce((a, c) => a + (c.box - 1) * 5, 0);
  return xp;
}
export function levelFor(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
  const [floor, title] = LEVELS[i];
  const next = LEVELS[i + 1];
  return { level: i + 1, title, floor, next: next ? next[0] : null, nextTitle: next ? next[1] : null, pct: next ? (xp - floor) / (next[0] - floor) : 1 };
}
export function computeStreak(activity, today = new Date()) {
  const has_ = (d) => (activity[dayKey(d)] || 0) > 0;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!has_(d)) d.setDate(d.getDate() - 1); // streak survives until the end of today
  let n = 0;
  while (has_(d) && n < 3650) { n++; d.setDate(d.getDate() - 1); }
  let best = 0, run = 0;
  const keys = Object.keys(activity).filter((k) => activity[k] > 0).sort();
  let prev = null;
  for (const k of keys) {
    const cur = new Date(k + 'T00:00:00');
    run = prev && Math.round((cur - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return { current: n, best: Math.max(best, n) };
}

export const BADGES = [
  { id: 'first-cut', icon: '🎬', name: 'First Cut', desc: 'Complete your first lesson', test: (s) => s.lessons >= 1 },
  { id: 'phase-1', icon: '🧱', name: 'Foundations', desc: 'Finish all Phase 1 lessons', test: (s) => s.phaseDone(1) },
  { id: 'phase-2', icon: '🎨', name: 'Craftsman', desc: 'Finish all Phase 2 lessons', test: (s) => s.phaseDone(2) },
  { id: 'phase-3', icon: '⚡', name: 'God Mode', desc: 'Finish all Phase 3 lessons', test: (s) => s.phaseDone(3) },
  { id: 'quiz-ace', icon: '💯', name: 'Quiz Ace', desc: 'Score 100% on any quiz', test: (s) => s.perfectQuiz },
  { id: 'quiz-master', icon: '🧠', name: 'Quiz Master', desc: 'Pass all 12 quizzes', test: (s) => s.quizzesPassed >= s.totalWeeks },
  { id: 'lab-rat', icon: '🧪', name: 'Lab Rat', desc: 'Use 5 labs', test: (s) => s.labs >= 5 },
  { id: 'mad-scientist', icon: '🔬', name: 'Mad Scientist', desc: 'Use every lab', test: (s) => s.labs >= s.totalLabs },
  { id: 'builder', icon: '🏗️', name: 'Builder', desc: 'Complete 3 weekly projects', test: (s) => s.projects >= 3 },
  { id: 'streak-7', icon: '🔥', name: 'On Fire', desc: '7-day streak', test: (s) => s.bestStreak >= 7 },
  { id: 'streak-30', icon: '🌋', name: 'Unstoppable', desc: '30-day streak', test: (s) => s.bestStreak >= 30 },
  { id: 'scholar', icon: '📚', name: 'Scholar', desc: 'Write 10 lesson notes', test: (s) => s.notes >= 10 },
  { id: 'memory', icon: '🃏', name: 'Total Recall', desc: 'Master 25 flashcards', test: (s) => s.mastered >= 25 },
  { id: 'certified', icon: '🏆', name: 'Certified', desc: 'Earn the HYPERCUT certificate', test: (s) => s.certified },
];

// courseMap: { weeks:[{n, lessons:[{id}], quizCount}], labs:[{id}] }
export function computeStats(p, courseMap) {
  const weeks = courseMap?.weeks || [];
  const allLessons = weeks.flatMap((w) => w.lessons.map((l) => l.id));
  const lessonsDone = allLessons.filter((id) => has(p.lessons, id)).length;
  const quizzesPassed = weeks.filter((w) => { const q = p.quizzes[String(w.n)]; return q && q.best / q.total >= QUIZ_PASS; }).length;
  const phaseDone = (n) => weeks.filter((w) => Math.ceil(w.n / 4) === n).every((w) => w.lessons.every((l) => has(p.lessons, l.id))) && weeks.some((w) => Math.ceil(w.n / 4) === n);
  const streak = computeStreak(p.activity);
  const certified = allLessons.length > 0 && lessonsDone === allLessons.length && quizzesPassed === weeks.length;
  const s = {
    lessons: lessonsDone, totalLessons: allLessons.length, quizzesPassed, totalWeeks: weeks.length,
    perfectQuiz: Object.values(p.quizzes).some((q) => q.best === q.total),
    labs: Object.keys(p.labs).length, totalLabs: courseMap?.labs?.length || 14,
    projects: Object.keys(p.projects).length, notes: Object.keys(p.notes).length,
    mastered: Object.values(p.cards).filter((c) => c.box >= 4).length,
    streak: streak.current, bestStreak: streak.best, phaseDone, certified,
  };
  s.xp = computeXP(p);
  s.level = levelFor(s.xp);
  s.badges = BADGES.map((b) => ({ ...b, earned: !!b.test(s) }));
  s.pct = allLessons.length ? lessonsDone / allLessons.length : 0;
  return s;
}

let mapPromise = null;
export function loadCourseMap() {
  if (!mapPromise) {
    mapPromise = fetch('/course-map.json', { credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error('map'); return r.json(); })
      .catch((e) => { mapPromise = null; throw e; });
  }
  return mapPromise;
}
