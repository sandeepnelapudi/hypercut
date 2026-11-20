// Content integrity + build output checks (SEO, links, CSP compliance).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { weeks, labs, faq } from '../../src/content/site.mjs';
import { scenarios } from '../../src/content/scenarios.mjs';
import { software } from '../../src/content/software.mjs';
import { effects } from '../../src/content/effects.mjs';
import { glossary } from '../../src/content/glossary.mjs';
import { resolveSafe } from '../../scripts/serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIST = path.join(ROOT, 'dist');

test('curriculum structure', () => {
  assert.equal(weeks.length, 12);
  const slugs = new Set();
  for (const w of weeks) {
    assert.equal(w.lessons.length, 5, `week ${w.n} has 5 lessons`);
    assert.ok(w.quiz.length >= 4, `week ${w.n} quiz`);
    assert.ok(w.outcomes.length >= 3);
    assert.ok(w.project?.title && w.project.deliverables.length);
    for (const id of w.labs) assert.ok(labs.find((l) => l.id === id), `lab ${id} exists`);
    for (const q of w.quiz) {
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `quiz answer index: ${q.q}`);
      assert.equal(new Set(q.options).size, q.options.length, `duplicate options: ${q.q}`);
      assert.ok(q.why);
    }
    for (const l of w.lessons) {
      assert.ok(!slugs.has(l.slug), `duplicate slug ${l.slug}`); slugs.add(l.slug);
      assert.match(l.slug, /^[a-z0-9-]+$/);
      assert.ok(l.body.length > 600, `lesson ${l.slug} has substance`);
      assert.ok(l.keyPoints.length >= 3 && l.exercise && l.summary && l.minutes > 0);
      assert.ok(!/<script|on\w+=|javascript:/i.test(l.body), `no script in lesson ${l.slug}`);
    }
  }
});

test('supporting content', () => {
  assert.equal(labs.length, 14);
  assert.ok(scenarios.length >= 25);
  const ids = new Set(scenarios.map((s) => s.id));
  assert.equal(ids.size, scenarios.length, 'unique scenario ids');
  for (const s of scenarios) {
    assert.deepEqual(Object.keys(s.tools).sort(), ['capcut', 'fcp', 'premiere', 'resolve']);
    assert.ok(s.fix.length >= 3 && s.prevention && s.diagnosis);
  }
  assert.ok(software.length >= 10);
  for (const s of software) for (const v of Object.values(s.scores)) assert.ok(v >= 0 && v <= 10);
  const faqText = faq.map((f) => f[1]).join(' ');
  const m = /(\d+) step-by-step recipes/.exec(faqText);
  if (m) assert.equal(Number(m[1]), effects.length, 'FAQ recipe count matches cookbook');
  const terms = glossary.map((g) => g[0].toLowerCase());
  assert.equal(new Set(terms).size, terms.length, 'unique glossary terms');
});

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p))); else out.push(p);
  }
  return out;
}

let htmlFiles = [];
before(async () => {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.mjs')], { stdio: 'ignore', env: { ...process.env, SITE_URL: 'https://hypercut.academy' } });
  htmlFiles = (await walk(DIST)).filter((f) => f.endsWith('.html'));
});

const urlFor = (file) => { const rel = '/' + path.relative(DIST, file).split(path.sep).join('/'); return rel.endsWith('/index.html') ? rel.slice(0, -10) : rel; };

test('every page has SEO essentials and is CSP-clean', async () => {
  assert.ok(htmlFiles.length >= 100, `pages: ${htmlFiles.length}`);
  const titles = new Map();
  for (const f of htmlFiles) {
    const html = await readFile(f, 'utf8');
    const u = urlFor(f);
    assert.match(html, /<html lang="en"/, u);
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    assert.ok(title && title.length >= 10 && title.length <= 110, `title length ${u}: ${title}`);
    const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
    assert.ok(desc && desc.length >= 40 && desc.length <= 300, `description ${u} (${desc?.length})`);
    assert.match(html, /<link rel="canonical" href="https:\/\/hypercut\.academy\//, u);
    assert.match(html, /<meta property="og:image"/, u);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `exactly one h1 on ${u}`);
    // CSP: no inline executable scripts, no inline handlers, no style attributes
    for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      const attrs = m[1];
      if (/type="application\/(ld\+)?json"/.test(attrs)) { assert.doesNotThrow(() => JSON.parse(m[2]), `JSON block on ${u}`); continue; }
      assert.match(attrs, /src="\//, `inline script on ${u}`);
      assert.equal(m[2].trim(), '', `inline script body on ${u}`);
    }
    assert.ok(!/\son[a-z]+="/i.test(html), `inline event handler on ${u}`);
    assert.ok(!/\sstyle="/i.test(html), `style attribute on ${u}`);
    assert.ok(!/<a [^>]*target="_blank"(?![^>]*rel="noopener)/.test(html), `target=_blank without noopener on ${u}`);
    if (!/noindex/.test(html)) {
      assert.ok(!titles.has(title), `duplicate title: ${title} (${u} & ${titles.get(title)})`);
      titles.set(title, u);
    }
  }
});

test('all internal links and assets resolve', async () => {
  const exists = async (p) => { try { const s = await stat(p); return s.isFile() || (s.isDirectory() && (await stat(path.join(p, 'index.html'))).isFile()); } catch { return false; } };
  const anchors = new Map();
  const broken = [];
  for (const f of htmlFiles) {
    const html = await readFile(f, 'utf8');
    anchors.set(urlFor(f), new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  for (const f of htmlFiles) {
    const html = await readFile(f, 'utf8');
    for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
      const raw = m[1].replace(/&amp;/g, '&');
      const [pathPart, hash] = raw.split('#');
      const clean = pathPart.split('?')[0];
      if (!clean) continue;
      const target = path.join(DIST, decodeURIComponent(clean));
      if (!(await exists(target))) { broken.push(`${urlFor(f)} → ${raw}`); continue; }
      if (hash && clean.endsWith('/') && anchors.has(clean) && !anchors.get(clean).has(hash)) broken.push(`${urlFor(f)} → ${raw} (missing #${hash})`);
    }
  }
  assert.deepEqual(broken, []);
});

test('sitemap, robots, manifest, search index', async () => {
  const sm = await readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 95);
  assert.equal(new Set(locs).size, locs.length, 'no duplicate sitemap URLs');
  for (const l of locs) {
    assert.ok(l.startsWith('https://hypercut.academy/'));
    const p = path.join(DIST, new URL(l).pathname, 'index.html');
    const html = await readFile(p, 'utf8');
    assert.ok(!html.includes('noindex'), `${l} is in the sitemap but marked noindex`);
  }
  for (const priv of ['/dashboard/', '/account/', '/login/', '/signup/', '/certificate/', '/search/']) assert.ok(!locs.includes('https://hypercut.academy' + priv), `${priv} excluded`);
  const robots = await readFile(path.join(DIST, 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/hypercut\.academy\/sitemap\.xml/);
  const manifest = JSON.parse(await readFile(path.join(DIST, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.short_name, 'HYPERCUT');
  const idx = JSON.parse(await readFile(path.join(DIST, 'search-index.json'), 'utf8'));
  assert.ok(idx.length > 200);
  for (const d of idx) assert.ok(d.u.startsWith('/') && d.t && d.k);
  const plan = JSON.parse(await readFile(path.join(DIST, 'plan.json'), 'utf8'));
  assert.equal(plan.length, 90, '90-day plan has exactly 90 days');
  assert.deepEqual(plan.map((d) => d.day), Array.from({ length: 90 }, (_, i) => i + 1));
});

test('structured data is valid JSON-LD with expected types', async () => {
  const home = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const types = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])['@type']);
  assert.deepEqual(types.sort(), ['Course', 'FAQPage', 'Organization', 'WebSite']);
  const course = JSON.parse([...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((j) => j.includes('"Course"')));
  assert.equal(course.syllabusSections.length, 12);
  assert.ok(course.hasCourseInstance && course.offers && course.provider);
});

test('static server blocks path traversal', () => {
  assert.equal(resolveSafe('/../../etc/passwd')?.startsWith(DIST), true, 'normalised inside dist');
  assert.equal(resolveSafe('/%2e%2e/%2e%2e/etc/passwd')?.startsWith(DIST), true);
  assert.equal(resolveSafe('/a%00b'), null);
  assert.equal(resolveSafe('/%E0%A4%A'), null);
});
