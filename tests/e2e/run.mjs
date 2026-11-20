// End-to-end tests with the preinstalled Playwright + Chromium.
// Usage: npm run test:e2e   (builds first, then serves dist on a random port)
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createServer } from '../../scripts/serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = path.join(ROOT, 'dist');

const server = createServer();
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const results = [];
let failed = 0;

async function t(name, fn) {
  const started = Date.now();
  try { await fn(); results.push(`  ✓ ${name} (${Date.now() - started}ms)`); } catch (e) { failed++; results.push(`  ✗ ${name}\n      ${String(e && e.stack || e).split('\n').slice(0, 4).join('\n      ')}`); }
  console.log(results[results.length - 1]);
}

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ baseURL: BASE, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(`console: ${m.text()}`); });
  page.on('dialog', (d) => { page.errors.push(`unexpected dialog: ${d.message()}`); d.dismiss().catch(() => {}); });
  return { ctx, page };
}
const noErrors = (page, where) => assert.deepEqual(page.errors.filter((e) => !/favicon/.test(e)), [], `errors on ${where}`);

// ---------------------------------------------------------------------------
const sitemap = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
const publicPaths = [...sitemap.matchAll(/<loc>[^<]*?(\/[^<]*)<\/loc>/g)].map((m) => new URL(m[1], BASE).pathname);
const appPaths = ['/login/', '/signup/', '/dashboard/', '/account/', '/search/?q=color', '/certificate/', '/nope-404/'];

await t(`all ${publicPaths.length + appPaths.length} pages load with no JS errors or CSP violations`, async () => {
  const { ctx, page } = await newPage();
  for (const p of [...publicPaths, ...appPaths]) {
    page.errors = [];
    const res = await page.goto(p, { waitUntil: 'load' });
    if (p === '/nope-404/') assert.equal(res.status(), 404); else assert.equal(res.status(), 200, p);
    if (p.startsWith('/labs/') && p !== '/labs/') await page.waitForFunction(() => !document.querySelector('.lab-loading'), null, { timeout: 5000 });
    await page.waitForTimeout(p.startsWith('/labs/') ? 250 : 30);
    if (p === '/nope-404/') page.errors = page.errors.filter((e) => !/Failed to load resource.*404/.test(e));
    noErrors(page, p);
  }
  await ctx.close();
});

await t('security headers are served', async () => {
  const res = await fetch(BASE + '/');
  for (const h of ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy']) assert.ok(res.headers.get(h), h);
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  const trav = await fetch(BASE + '/..%2f..%2fpackage.json');
  assert.notEqual(trav.status, 200);
  const post = await fetch(BASE + '/', { method: 'POST' });
  assert.equal(post.status, 405);
});

const userA = { name: 'Ava Montage', email: `ava${Date.now()}@example.com`, password: 'CutOnAction24' };

await t('signup validation, account creation, dashboard', async () => {
  const { ctx, page } = await newPage();
  await page.goto('/signup/');
  await page.click('button[type=submit]');
  await assert.doesNotReject(page.waitForSelector('.form-error:text("Enter your name.")'));
  await page.fill('#name', userA.name);
  await page.fill('#email', 'not-an-email');
  await page.fill('#password', 'short');
  await page.click('button[type=submit]');
  await page.waitForSelector('.form-error:text("valid email")');
  await page.fill('#email', userA.email);
  await page.click('button[type=submit]');
  await page.waitForSelector('.form-error:text("at least 8")');
  await page.fill('#password', userA.password);
  await page.click('button[type=submit]');
  await page.waitForSelector('.form-error:text("accept the terms")');
  await page.check('#terms');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard/', { timeout: 15000 });
  await page.waitForSelector('#page-h1:text("Hey Ava")');
  await page.waitForSelector('.user-chip');
  // Storage contains no plaintext password
  const dump = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  assert.ok(!dump.includes(userA.password));
  // Duplicate signup rejected
  await page.click('.user-chip'); await page.click('text=Log out'); await page.waitForURL(BASE + '/');
  await page.goto('/signup/');
  await page.fill('#name', 'Dup'); await page.fill('#email', userA.email.toUpperCase()); await page.fill('#password', 'Another123x'); await page.check('#terms');
  await page.click('button[type=submit]');
  await page.waitForSelector('.form-error:text("already exists")', { timeout: 15000 });
  noErrors(page, 'signup');
  await ctx.storageState({ path: path.join(ROOT, 'dist', '.e2e-state.json') });
  await ctx.close();
});

let shared;
await t('login (wrong then right) and open-redirect protection', async () => {
  // Same browser profile as signup (localStorage is per-profile, like a real user's browser).
  shared = await newPage({ storageState: path.join(ROOT, 'dist', '.e2e-state.json') });
  const { page } = shared;
  await page.goto('/login/?next=https://evil.example.com');
  await page.fill('#email', userA.email); await page.fill('#password', 'WrongPass99');
  await page.click('button[type=submit]');
  await page.waitForSelector('.form-error:text("Incorrect email or password")', { timeout: 15000 });
  await page.fill('#password', userA.password);
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard/', { timeout: 15000 });
  assert.equal(new URL(page.url()).origin, BASE, 'stayed on site');
  noErrors(page, 'login');
});

await t('lesson: complete, bookmark, note (XSS stays inert), persists across reloads', async () => {
  const { page } = shared;
  await page.goto('/lesson/01-frames-fps-and-motion/');
  await page.click('[data-complete]');
  await page.waitForSelector('[data-complete][aria-pressed="true"]');
  await page.click('[data-bookmark]');
  await page.waitForSelector('[data-bookmark][aria-pressed="true"]');
  const evil = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=2</script> my notes';
  await page.fill('[data-note]', evil);
  await page.waitForSelector('[data-note-status]:text("Saved")', { timeout: 5000 });
  await page.reload();
  await page.waitForSelector('[data-complete][aria-pressed="true"]');
  assert.equal(await page.inputValue('[data-note]'), evil);
  await page.goto('/dashboard/');
  await page.waitForSelector('.note-list .snippet');
  assert.equal(await page.textContent('.note-list .snippet'), evil, 'rendered as text');
  assert.equal(await page.evaluate(() => window.__pwned), undefined, 'no script execution');
  assert.equal(await page.locator('.note-list img').count(), 0);
  await page.waitForSelector('text=★ Frames, Frame Rates');
  noErrors(page, 'lesson');
});

await t('quiz: unanswered warning, wrong then perfect score, best saved', async () => {
  const { page } = shared;
  await page.goto('/week/01-how-video-works/');
  await page.click('#quiz-form button[type=submit]');
  await page.waitForSelector('.quiz-result:text("Answer all questions")');
  const data = JSON.parse(await page.textContent('#quiz-data'));
  for (const [i, q] of data.questions.entries()) await page.check(`input[name="q${i}"][value="${(q.answer + 1) % q.options.length}"]`);
  await page.click('#quiz-form button[type=submit]');
  await page.waitForSelector('.quiz-result:text("You need 80%")');
  for (const [i, q] of data.questions.entries()) await page.check(`input[name="q${i}"][value="${q.answer}"]`);
  await page.click('#quiz-form button[type=submit]');
  await page.waitForSelector('.quiz-result:text("Passed")');
  await page.reload();
  await page.waitForSelector(`.quiz-result:text("Your best: ${data.questions.length}/${data.questions.length}")`);
  await page.click('[data-project-toggle]');
  await page.waitForSelector('[data-project-toggle].is-on');
  noErrors(page, 'quiz');
});

await t('planner auto-ticks completed work; flashcards review', async () => {
  const { page } = shared;
  await page.goto('/planner/');
  await page.waitForSelector('.plan-day');
  assert.equal(await page.locator('.plan-day').count(), 90);
  assert.ok(await page.isChecked('#day-1'), 'day 1 lesson auto-complete');
  assert.ok(await page.isChecked('#day-6'), 'day 6 quiz auto-complete');
  assert.ok(await page.isChecked('#day-7'), 'day 7 project auto-complete');
  await page.check('#day-2');
  await page.waitForSelector('.plan-day.done >> nth=3');
  await page.goto('/flashcards/');
  await page.waitForSelector('.fc-inner');
  await page.keyboard.press('Space');
  await page.keyboard.press('2');
  await page.waitForSelector('.boxes span:text("Box 2: 1")');
  noErrors(page, 'planner/flashcards');
});

await t('user isolation: second user sees none of the first user\'s data', async () => {
  const { ctx, page } = await newPage({ storageState: undefined });
  // same browser profile as user A to prove per-account separation
  const state = await shared.ctx.storageState();
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { for (const o of s.origins) for (const { name, value } of o.localStorage) localStorage.setItem(name, value); localStorage.removeItem('hc:v1~session'); sessionStorage.setItem('seeded', '1'); } }, state);
  await page.goto('/signup/');
  await page.fill('#name', 'Ben Grader'); await page.fill('#email', `ben${Date.now()}@example.com`); await page.fill('#password', 'NodeTree77'); await page.check('#terms');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard/', { timeout: 15000 });
  await page.waitForSelector('.stat');
  assert.match(await page.textContent('.dash-grid'), /0\/60/);
  assert.ok(!(await page.content()).includes('my notes'));
  noErrors(page, 'isolation');
  await ctx.close();
});

await t('certificate unlocks after all lessons + quizzes', async () => {
  const { page } = shared;
  await page.goto('/certificate/');
  await page.waitForSelector('text=Almost there');
  await page.evaluate(async () => {
    const P = await import('/assets/js/core/progress.js');
    const map = await P.loadCourseMap();
    for (const w of map.weeks) { for (const l of w.lessons) await P.setLessonComplete(l.id, true); await P.recordQuiz(String(w.n), w.quizCount, w.quizCount); }
  });
  await page.reload();
  await page.waitForSelector('#page-h1:text("Congratulations")');
  await page.waitForSelector('canvas[aria-label*="Ava Montage"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=Download PNG')]);
  assert.match(dl.suggestedFilename(), /^HYPERCUT-certificate-HC-[0-9A-F]{12}\.png$/);
  await page.goto('/dashboard/');
  await page.waitForSelector('.badge:not(.locked):has-text("Certified")');
  noErrors(page, 'certificate');
});

await t('account: rename (XSS rejected), change password, export data', async () => {
  const { page } = shared;
  await page.goto('/account/');
  await page.waitForSelector('#acc-name');
  await page.fill('#acc-name', '<b>bad</b>');
  await page.click('text=Save profile');
  await page.waitForSelector('#account-root .form-error:text("not allowed")');
  await page.fill('#acc-name', 'Ava M. Montage');
  await page.click('text=Save profile');
  await page.waitForSelector('.toast:text("Profile saved")');
  await page.fill('#cur-pw', userA.password); await page.fill('#new-pw', 'NewTimeline88');
  await page.click('#pw-form button');
  await page.waitForSelector('.toast:text("Password updated")', { timeout: 15000 });
  userA.password = 'NewTimeline88';
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-data')]);
  const json = JSON.parse(await readFile(await dl.path(), 'utf8'));
  assert.equal(json.account.name, 'Ava M. Montage');
  assert.ok(!JSON.stringify(json).includes('"hash"'), 'export excludes password hash');
  noErrors(page, 'account');
});

await t('protected pages redirect to login when logged out', async () => {
  const { ctx, page } = await newPage();
  for (const p of ['/dashboard/', '/account/', '/certificate/']) {
    await page.goto(p);
    await page.waitForURL(`**/login/?next=${encodeURIComponent(p)}`);
  }
  noErrors(page, 'protected');
  await ctx.close();
});

await t('guest progress migrates into new account', async () => {
  const { ctx, page } = await newPage();
  await page.goto('/lesson/02-the-editing-toolkit/');
  await page.click('[data-complete]');
  await page.waitForSelector('[data-complete][aria-pressed="true"]');
  await page.goto('/signup/');
  await page.fill('#name', 'Gus Guest'); await page.fill('#email', `gus${Date.now()}@example.com`); await page.fill('#password', 'Proxies4Life'); await page.check('#terms');
  await page.click('button[type=submit]');
  await page.waitForURL('**/dashboard/', { timeout: 15000 });
  await page.waitForSelector('.dash-grid');
  assert.match(await page.textContent('.dash-grid'), /1\/60/);
  noErrors(page, 'migrate');
  await ctx.close();
});

await t('search, playbook filter, glossary filter, software filter', async () => {
  const { ctx, page } = await newPage();
  await page.goto('/search/?q=drop%20frame');
  await page.waitForSelector('#search-results li');
  assert.ok(await page.locator('#search-results li').count() >= 2);
  await page.fill('#q', '<img src=x onerror=alert(1)>');
  await page.waitForSelector('#search-count:text("No results")');
  await page.goto('/playbook/');
  await page.fill('#pb-search', 'wind noise');
  await page.waitForTimeout(200);
  assert.ok(await page.isVisible('#wind-noise'));
  assert.ok((await page.locator('.scenario:visible').count()) <= 3);
  await page.fill('#pb-search', '');
  await page.click('.chip[data-cat="audio"]');
  await page.waitForTimeout(100);
  const n = await page.locator('.scenario:visible').count();
  assert.ok(n >= 3 && n < 15);
  await page.goto('/playbook/#flicker');
  await page.waitForTimeout(100);
  assert.equal(await page.getAttribute('#flicker', 'open'), '');
  await page.goto('/glossary/');
  await page.fill('#gl-search', 'vectorscope');
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.gl-item:visible').count(), 1);
  await page.goto('/software/');
  await page.selectOption('#sw-os', 'Linux');
  const vis = await page.locator('#sw-table tbody tr:visible').count();
  assert.ok(vis >= 3 && vis < 12);
  await page.selectOption('#sw-sort', 'color');
  assert.match(await page.textContent('#sw-table tbody tr:visible >> nth=0'), /Resolve/);
  noErrors(page, 'search');
  await ctx.close();
});

await t('labs respond to input', async () => {
  const { ctx, page } = await newPage();
  await page.goto('/labs/color-grading/');
  await page.waitForSelector('#lab-root canvas');
  const before = await page.evaluate(() => document.querySelector('#lab-root .canvas-wrap canvas').toDataURL().length);
  await page.selectOption('#lab-root select', 'tealOrange');
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => document.querySelector('#lab-root .canvas-wrap canvas').toDataURL().length);
  assert.notEqual(before, after, 'grade changed image');
  await page.waitForSelector('.toast:text("New lab unlocked")');
  await page.goto('/labs/timecode/');
  const tc = page.locator('#lab-root input[aria-label="Timecode"]');
  await tc.fill('00:01:00;00');
  await page.waitForSelector('#lab-root .form-error:text("does not exist")');
  await tc.fill('00:01:00;02');
  await page.waitForSelector('#lab-root .v:text("1,800")');
  await page.goto('/labs/beat-sync/');
  await page.fill('#lab-root input[type=number]', '120');
  await page.waitForSelector('#lab-root .v:text("12.00")');
  await page.goto('/labs/dof-lens/');
  await page.waitForSelector('#lab-root .v:text("29.81 m")');
  await page.goto('/labs/shortcut-trainer/');
  await page.click('text=Start (15 questions)');
  const action = await page.textContent('.key-display');
  const { SETS } = await page.evaluate(async () => ({ SETS: (await import('/assets/js/labs/shortcut-trainer.js')).SETS }));
  const key = SETS.premiere.keys.find(([a]) => a === action)[1];
  const pw = key.replace('Ctrl+', 'Control+').replace(/^Space$/, ' ').replace('ArrowDown', 'ArrowDown');
  await page.keyboard.press(pw === ' ' ? 'Space' : pw);
  await page.waitForSelector('.key-display:not(:text("' + action.replace(/"/g, '\\"') + '"))');
  for (const lab of ['easing', 'chroma-key', 'blend-modes', 'composition', 'aspect-safe-zones', 'color-harmony', 'shutter-fps', 'bitrate-calculator', 'eq-trainer']) {
    await page.goto(`/labs/${lab}/`);
    await page.waitForSelector('#lab-root > *:not(.lab-loading)');
    const r = page.locator('#lab-root input[type=range]').first();
    if (await r.count()) { await r.focus(); await page.keyboard.press('ArrowRight'); }
    const s = page.locator('#lab-root select').first();
    if (await s.count()) { const opts = await s.locator('option').evaluateAll((o) => o.map((x) => x.value)); await s.selectOption(opts[opts.length - 1]); }
    await page.waitForTimeout(150);
  }
  noErrors(page, 'labs');
  await ctx.close();
});

await t('image upload in lab rejects non-images and accepts PNG', async () => {
  const { ctx, page } = await newPage();
  await page.goto('/labs/color-grading/');
  await page.setInputFiles('#lab-root input[type=file]', { name: 'evil.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg onload="alert(1)"/>') });
  await page.waitForSelector('.toast.err:text("Please choose")');
  await page.setInputFiles('#lab-root input[type=file]', path.join(ROOT, 'src/assets/img/icon-192.png'));
  await page.waitForSelector('.toast:text("Image loaded")');
  noErrors(page, 'upload');
  await ctx.close();
});

await t('mobile: no horizontal overflow, nav toggle works', async () => {
  const { ctx, page } = await newPage({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  for (const p of ['/', '/curriculum/', '/lesson/06-color-spaces-gamma-log/', '/labs/color-grading/', '/playbook/', '/software/', '/effects/', '/engine/', '/planner/', '/signup/', '/labs/aspect-safe-zones/', '/labs/timecode/', '/week/07-color-grading/']) {
    await page.goto(p);
    await page.waitForTimeout(150);
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    assert.ok(sw <= iw + 1, `${p} overflows: ${sw} > ${iw}`);
  }
  await page.goto('/');
  assert.equal(await page.isVisible('#primary-nav'), false);
  await page.click('.nav-toggle');
  assert.equal(await page.isVisible('#primary-nav a:text("Labs")'), true);
  noErrors(page, 'mobile');
  await ctx.close();
});

await t('theme toggle persists; keyboard "/" opens search', async () => {
  const { ctx, page } = await newPage({ colorScheme: 'dark' });
  await page.goto('/');
  await page.click('#theme-toggle');
  assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
  await page.reload();
  assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
  await page.keyboard.press('/');
  await page.waitForURL('**/search/');
  noErrors(page, 'theme');
  await ctx.close();
});

await t('accessibility basics: labels, alt, landmarks, lang', async () => {
  const { ctx, page } = await newPage();
  for (const p of ['/', '/signup/', '/labs/color-grading/', '/labs/chroma-key/', '/lesson/01-frames-fps-and-motion/', '/week/01-how-video-works/', '/flashcards/']) {
    await page.goto(p);
    await page.waitForTimeout(200);
    const issues = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((el) => {
        const labelled = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label');
        if (!labelled) out.push(`unlabelled ${el.tagName} ${el.type || ''} ${el.id || ''}`);
      });
      document.querySelectorAll('img:not([alt])').forEach((el) => out.push(`img without alt ${el.src}`));
      document.querySelectorAll('button').forEach((b) => { if (!b.textContent.trim() && !b.getAttribute('aria-label')) out.push('button without name'); });
      if (!document.querySelector('main')) out.push('no main');
      if (!document.documentElement.lang) out.push('no lang');
      return out;
    });
    assert.deepEqual(issues, [], p);
  }
  await ctx.close();
});

await shared.ctx.close();
await browser.close();
server.close();
console.log(`\n${results.length - failed}/${results.length} e2e tests passed`);
process.exit(failed ? 1 : 0);
