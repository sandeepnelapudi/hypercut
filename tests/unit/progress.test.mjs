import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshDB } from './_setup.mjs';
import * as auth from '../../src/assets/js/core/auth.js';
import * as P from '../../src/assets/js/core/progress.js';

let db;
beforeEach(() => { db = freshDB(); });

const map = {
  weeks: Array.from({ length: 12 }, (_, i) => ({ n: i + 1, quizCount: 5, lessons: Array.from({ length: 5 }, (_, j) => ({ id: `w${String(i + 1).padStart(2, '0')}-l${j + 1}` })) })),
  labs: Array.from({ length: 14 }, (_, i) => ({ id: `lab${i}` })),
};

test('guest progress: lessons, bookmarks, notes, quizzes', async () => {
  await P.setLessonComplete('w01-l1', true);
  assert.equal(await P.toggleBookmark('w01-l1'), true);
  assert.equal(await P.toggleBookmark('w01-l1'), false);
  await P.saveNote('w01-l1', 'x'.repeat(6000));
  let p = await P.loadProgress();
  assert.ok(p.lessons['w01-l1']);
  assert.equal(p.notes['w01-l1'].text.length, P.NOTE_MAX);
  await P.saveNote('w01-l1', '   ');
  p = await P.loadProgress();
  assert.equal(p.notes['w01-l1'], undefined, 'empty note deleted');
  const r1 = await P.recordQuiz('1', 3, 5);
  assert.equal(r1.passed, false);
  const r2 = await P.recordQuiz('1', 2, 5);
  assert.equal(r2.improved, false);
  assert.equal(r2.best, 3);
  const r3 = await P.recordQuiz('1', 5, 5);
  assert.equal(r3.passed, true);
  await P.setLessonComplete('w01-l1', false);
  p = await P.loadProgress();
  assert.equal(p.lessons['w01-l1'], undefined);
});

test('invalid ids and scores are rejected', async () => {
  for (const bad of ['__proto__', 'constructor', '../x', '', 'A B', 'x'.repeat(41)]) {
    await assert.rejects(P.setLessonComplete(bad, true), bad);
  }
  await assert.rejects(P.recordQuiz('1', 6, 5));
  await assert.rejects(P.recordQuiz('1', -1, 5));
  await assert.rejects(P.recordQuiz('1', 1.5, 5));
  const p = await P.loadProgress();
  assert.equal(Object.prototype.hasOwnProperty.call(p.lessons, 'constructor'), false);
  assert.equal(P.computeStats(p, map).lessons, 0);
});

test('sanitiseProgress drops malformed and hostile data', () => {
  const raw = JSON.parse('{"lessons":{"w01-l1":123,"bad key":1,"w01-l2":"x"},"quizzes":{"1":{"best":99,"total":5},"2":{"best":1,"total":0}},"notes":{"w01-l1":{"text":42}},"cards":{"a-roll":{"box":99}},"activity":{"2026-01-01":5,"nope":1}}');
  const p = P.sanitiseProgress(raw);
  assert.deepEqual(Object.keys(p.lessons), ['w01-l1']);
  assert.equal(p.quizzes['1'].best, 5, 'clamped to total');
  assert.equal(p.quizzes['2'], undefined);
  assert.equal(p.notes['w01-l1'], undefined);
  assert.equal(p.cards['a-roll'].box, 5);
  assert.deepEqual(Object.keys(p.activity), ['2026-01-01']);
  assert.deepEqual(P.sanitiseProgress(null), P.emptyProgress());
  assert.deepEqual(P.sanitiseProgress('str'), P.emptyProgress());
});

test('progress is per-user and guest progress migrates on signup', async () => {
  await P.setLessonComplete('w01-l1', true);
  const u = await auth.register({ name: 'Bo Cutter', email: 'bo@example.com', password: 'Timeline42' });
  assert.equal(await P.migrateGuestTo(u.id), true);
  let p = await P.loadProgress();
  assert.ok(p.lessons['w01-l1'], 'migrated to account');
  assert.equal(await db.get('progress', P.GUEST_ID), null);
  await auth.logout();
  p = await P.loadProgress();
  assert.equal(Object.keys(p.lessons).length, 0, 'guest sees nothing after logout');
  await auth.register({ name: 'Cy Grader', email: 'cy@example.com', password: 'Timeline43' });
  p = await P.loadProgress();
  assert.equal(Object.keys(p.lessons).length, 0, 'second user does not see first user\'s progress');
});

test('concurrent writes are serialised (no lost updates)', async () => {
  await Promise.all(Array.from({ length: 20 }, (_, i) => P.setLessonComplete(`w02-l${(i % 5) + 1}`, true).then(() => P.visitLab(`lab${i % 14}`))));
  const p = await P.loadProgress();
  assert.equal(Object.keys(p.lessons).length, 5);
  assert.equal(Object.keys(p.labs).length, 14);
});

test('XP, levels, badges and certification', async () => {
  const p = P.emptyProgress();
  assert.equal(P.computeXP(p), 0);
  assert.equal(P.levelFor(0).title, 'Intern');
  assert.equal(P.levelFor(300).title, 'Assistant Editor');
  assert.equal(P.levelFor(99999).title, 'Edit God');
  assert.equal(P.levelFor(99999).next, null);
  for (const w of map.weeks) { for (const l of w.lessons) p.lessons[l.id] = 1; p.quizzes[String(w.n)] = { best: 4, total: 5, at: 1 }; }
  const s = P.computeStats(p, map);
  assert.equal(s.lessons, 60);
  assert.equal(s.quizzesPassed, 12);
  assert.equal(s.certified, true);
  assert.equal(s.xp, 60 * 50 + 12 * (40 + 100));
  assert.ok(s.badges.find((b) => b.id === 'certified').earned);
  assert.ok(s.badges.find((b) => b.id === 'phase-3').earned);
  assert.ok(!s.badges.find((b) => b.id === 'quiz-ace').earned);
  p.quizzes['12'].best = 3; // 60% → fail
  assert.equal(P.computeStats(p, map).certified, false);
});

test('streak calculation', () => {
  const today = new Date(2026, 10, 20);
  const k = (d) => P.dayKey(new Date(2026, 10, d));
  assert.deepEqual(P.computeStreak({}, today), { current: 0, best: 0 });
  assert.equal(P.computeStreak({ [k(20)]: 1, [k(19)]: 2, [k(18)]: 1 }, today).current, 3);
  assert.equal(P.computeStreak({ [k(19)]: 1, [k(18)]: 1 }, today).current, 2, 'streak survives until end of today');
  assert.equal(P.computeStreak({ [k(17)]: 1, [k(16)]: 1 }, today).current, 0);
  assert.equal(P.computeStreak({ [k(1)]: 1, [k(2)]: 1, [k(3)]: 1, [k(4)]: 1, [k(20)]: 1 }, today).best, 4);
  // month boundary
  const t2 = new Date(2026, 11, 1);
  assert.equal(P.computeStreak({ [P.dayKey(new Date(2026, 10, 30))]: 1, [P.dayKey(t2)]: 1 }, t2).current, 2);
});

test('flashcard Leitner boxes', async () => {
  let c = await P.reviewCard('a-roll', true);
  assert.equal(c.box, 2);
  c = await P.reviewCard('a-roll', true);
  assert.equal(c.box, 3);
  assert.ok(c.due > Date.now());
  c = await P.reviewCard('a-roll', false);
  assert.equal(c.box, 1);
  for (let i = 0; i < 10; i++) c = await P.reviewCard('a-roll', true);
  assert.equal(c.box, 5);
});

test('mergeProgress keeps best of both', () => {
  const a = P.emptyProgress(); a.quizzes['1'] = { best: 2, total: 5, at: 1 }; a.notes['w01-l1'] = { text: 'mine', at: 1 };
  const b = P.emptyProgress(); b.quizzes['1'] = { best: 4, total: 5, at: 2 }; b.notes['w01-l1'] = { text: 'guest', at: 2 }; b.lessons['w01-l2'] = 5;
  const m = P.mergeProgress(a, b);
  assert.equal(m.quizzes['1'].best, 4);
  assert.match(m.notes['w01-l1'].text, /mine[\s\S]*guest/);
  assert.equal(m.lessons['w01-l2'], 5);
});
