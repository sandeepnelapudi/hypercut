#!/usr/bin/env node
// HYPERCUT static site generator. Produces fully pre-rendered, crawlable HTML in /dist.
import { mkdir, writeFile, cp, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, phases, weeks, labs, faq, lessonId, weekPath, lessonPath } from '../src/content/site.mjs';
import { scenarios } from '../src/content/scenarios.mjs';
import { software, scoreLabels, softwareNote } from '../src/content/software.mjs';
import { effects } from '../src/content/effects.mjs';
import { glossary } from '../src/content/glossary.mjs';
import { engineChapters } from '../src/content/engine.mjs';
import { tools, TOOL_CATEGORIES, BUDGETS, FOCUSES } from '../src/content/toolkit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// ---------- helpers ----------
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stripTags = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pad2 = (n) => String(n).padStart(2, '0');
// JSON safe to embed inside <script type="application/json|ld+json">
const jsonEmbed = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const pages = []; // {path, priority, changefreq, index}
let assetVersion = 'dev';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const NAV = [
  ['/curriculum/', 'Curriculum'],
  ['/labs/', 'Labs'],
  ['/toolkit/', 'Toolkit'],
  ['/playbook/', 'Playbook'],
  ['/effects/', 'Effects'],
  ['/software/', 'Software'],
  ['/engine/', 'Engine'],
];

function layout({ title, description, urlPath, body, jsonld = [], noindex = false, scripts = [], ogType = 'website', bodyClass = '' }) {
  const canonical = site.url + urlPath;
  const fullTitle = urlPath === '/' ? `${site.fullName} | 90-Day Video Editing Course` : `${title} | ${site.name}`;
  const nav = NAV.map(([href, label]) => `<li><a href="${href}"${urlPath.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  const ld = jsonld.map((o) => `<script type="application/ld+json">${jsonEmbed(o)}</script>`).join('\n');
  const scriptTags = ['/assets/js/app.js', ...scripts].map((s) => `<script type="module" src="${s}?v=${assetVersion}"></script>`).join('\n');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="${site.themeColor}">
<meta property="og:site_name" content="${esc(site.fullName)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${site.url}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${site.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="${site.twitter}">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${site.url}/assets/img/og.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/icon-192.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/css/main.css?v=${assetVersion}">
<script src="/assets/js/theme-init.js?v=${assetVersion}"></script>
${ld}
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="${esc(site.fullName)} home"><span class="brand-mark" aria-hidden="true">▶</span><span class="brand-name">HYPER<span>CUT</span></span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav"><span class="sr-only">Menu</span><span aria-hidden="true">☰</span></button>
    <nav id="primary-nav" class="primary-nav" aria-label="Primary"><ul>${nav}</ul></nav>
    <div class="header-actions">
      <a class="icon-btn" href="/search/" aria-label="Search the course" title="Search (/)">⌕</a>
      <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle light/dark theme" title="Toggle theme">◐</button>
      <div id="auth-slot" class="auth-slot"><a class="btn btn-sm btn-ghost" href="/login/">Log in</a><a class="btn btn-sm" href="/signup/">Start free</a></div>
    </div>
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="site-footer">
  <div class="container footer-grid">
    <div><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">▶</span><span class="brand-name">HYPER<span>CUT</span></span></a><p class="muted">${esc(site.tagline)}</p></div>
    <div><h2 class="footer-h">Learn</h2><ul><li><a href="/curriculum/">Curriculum</a></li><li><a href="/planner/">90-Day Planner</a></li><li><a href="/flashcards/">Flashcards</a></li><li><a href="/glossary/">Glossary</a></li></ul></div>
    <div><h2 class="footer-h">Master</h2><ul><li><a href="/labs/">Interactive Labs</a></li><li><a href="/toolkit/">Editor's Toolkit</a></li><li><a href="/playbook/">Scenario Playbook</a></li><li><a href="/effects/">Effects Cookbook</a></li><li><a href="/engine/">Inside the Engine</a></li></ul></div>
    <div><h2 class="footer-h">About</h2><ul><li><a href="/about/">About HYPERCUT</a></li><li><a href="/software/">Software Compared</a></li><li><a href="/privacy/">Privacy</a></li><li><a href="/terms/">Terms</a></li></ul></div>
  </div>
  <div class="container footer-bottom muted">© ${new Date().getFullYear()} ${esc(site.fullName)}. Made for editors who refuse to be average.</div>
</footer>
<div id="toast-region" class="toast-region" role="status" aria-live="polite"></div>
${scriptTags}
</body>
</html>`;
}

async function emit(urlPath, html, { priority = 0.6, changefreq = 'monthly', index = true } = {}) {
  const file = urlPath.endsWith('/') ? path.join(DIST, urlPath, 'index.html') : path.join(DIST, urlPath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
  pages.push({ path: urlPath, priority, changefreq, index });
}

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + p })),
});
const breadcrumbHtml = (items) => `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items.map(([name, p], i) => i === items.length - 1 ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${p}">${esc(name)}</a></li>`).join('')}</ol></nav>`;

const orgLd = { '@context': 'https://schema.org', '@type': 'Organization', name: site.fullName, url: site.url, logo: site.url + '/assets/img/icon-512.png' };
const totalLessons = weeks.reduce((a, w) => a + w.lessons.length, 0);
const totalMinutes = weeks.reduce((a, w) => a + w.lessons.reduce((b, l) => b + l.minutes, 0), 0);
const totalQuiz = weeks.reduce((a, w) => a + w.quiz.length, 0);

const courseLd = {
  '@context': 'https://schema.org', '@type': 'Course',
  name: site.fullName,
  description: site.description,
  url: site.url + '/curriculum/',
  provider: { '@type': 'Organization', name: site.fullName, sameAs: site.url },
  inLanguage: 'en',
  educationalLevel: 'Beginner to Advanced',
  teaches: ['Video editing', 'Cinematography', 'Color grading', 'Color theory', 'Sound design', 'Motion graphics', 'VFX compositing', 'Short-form content editing', 'AI video tools'],
  timeRequired: 'P90D',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT1H30M', courseSchedule: { '@type': 'Schedule', duration: 'PT1H30M', repeatFrequency: 'Daily', repeatCount: 90 } },
  syllabusSections: weeks.map((w) => ({ '@type': 'Syllabus', name: `Week ${w.n}: ${w.title}`, description: w.goal, timeRequired: `PT${w.lessons.reduce((b, l) => b + l.minutes, 0)}M` })),
};

// ---------- pages ----------
function progressRing() {
  return `<div class="hero-progress" id="hero-progress" hidden><span class="ring" aria-hidden="true"></span><span class="hero-progress-text"></span></div>`;
}

async function buildHome() {
  const phaseCards = phases.map((p) => `
  <article class="phase-card phase-${p.n}">
    <div class="phase-num">Phase ${p.n}</div>
    <h3>${esc(p.name)}</h3>
    <p class="muted">${esc(p.blurb)}</p>
    <ol class="phase-weeks">${p.weeks.map((n) => { const w = weeks[n - 1]; return `<li><a href="${weekPath(w)}"><span class="wk">W${pad2(n)}</span> ${esc(w.title)}</a></li>`; }).join('')}</ol>
  </article>`).join('');
  const labCards = labs.slice(0, 8).map((l) => `<a class="lab-card" href="/labs/${l.id}/"><span class="lab-icon" aria-hidden="true">${l.icon}</span><strong>${esc(l.name)}</strong><span class="muted small">${esc(l.blurb)}</span></a>`).join('');
  const faqHtml = faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  const body = `
<section class="hero">
  <div class="hero-bg" aria-hidden="true"><div class="scanline"></div></div>
  <div class="container hero-inner">
    <p class="eyebrow">The 90-day video editing course</p>
    <h1 class="hero-title">Edit <span class="glitch" data-text="God Mode">God Mode</span><br>in 90 days.</h1>
    <p class="hero-sub">${esc(site.description)}</p>
    <div class="hero-cta"><a class="btn btn-lg" href="/signup/">Start the 90-day run, free</a><a class="btn btn-lg btn-ghost" href="/curriculum/">See the full curriculum</a></div>
    ${progressRing()}
    <ul class="stat-row" aria-label="Course at a glance">
      <li><strong>12</strong><span>weeks</span></li>
      <li><strong>${totalLessons}</strong><span>lessons</span></li>
      <li><strong>${labs.length}</strong><span>labs & tools</span></li>
      <li><strong>${scenarios.length}</strong><span>real-world scenarios</span></li>
      <li><strong>${totalQuiz}</strong><span>quiz questions</span></li>
    </ul>
  </div>
  <div class="timeline-strip" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<span class="clip c${i % 6}"></span>`).join('')}<span class="playhead"></span></div>
</section>

<section class="container section">
  <h2 class="section-title">Three phases. One transformation.</h2>
  <p class="section-sub">Each topic builds on the one before it. You learn how the pixels work, then the craft, then the advanced techniques the top editors use.</p>
  <div class="phase-grid">${phaseCards}</div>
</section>

<section class="container section">
  <h2 class="section-title">What makes HYPERCUT different</h2>
  <div class="feature-grid">
    <div class="feature"><span class="f-icon" aria-hidden="true">🧪</span><h3>${labs.length} hands-on labs</h3><p>Grade with live scopes, pull keys, train your ears, sync to beats and design easing curves in your browser.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">🛠️</span><h3>Scenario Playbook</h3><p>${scenarios.length} real problems with fixes: wind noise, mixed light, shaky footage, "make it pop", a 2-hour deadline. Steps for every major editor.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">⚙️</span><h3>Inside the Engine</h3><p>Follow a frame from photon to screen: sensors, codecs, GPU pipelines, color management and AI models.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">🔥</span><h3>Trend-proof effects</h3><p>${effects.length} step-by-step recipes for speed ramps, whip pans, text-behind-subject, datamosh, film emulation and more.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">📅</span><h3>90-day planner</h3><p>A daily plan with streaks, XP, badges and spaced-repetition flashcards to keep you on track.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">🏆</span><h3>Capstone + certificate</h3><p>Build a showreel and a full client project, then download your HYPERCUT certificate.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">🎯</span><h3>Interactive lessons with missions</h3><p>Expose a sunny scene with ND, light a Rembrandt portrait, master ripple, roll, slip and slide, and recreate the Kuleshov experiment, with every challenge checked automatically.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">🧰</span><h3>The editor's toolkit</h3><p>${tools.length} essential tools, plugins, assets and hardware, with a kit builder for your budget and type of work.</p></div>
    <div class="feature"><span class="f-icon" aria-hidden="true">🔊</span><h3>Pro tools in your browser</h3><p>A LUFS loudness meter, export settings with FFmpeg commands, a caption/SRT maker, a rate calculator and a shot list builder.</p></div>
  </div>
</section>

<section class="container section">
  <div class="section-head"><h2 class="section-title">Try a lab right now</h2><a href="/labs/" class="link-arrow">All ${labs.length} labs →</a></div>
  <div class="lab-grid">${labCards}</div>
</section>

<section class="container section">
  <h2 class="section-title">By day 90 you will be able to</h2>
  <ul class="check-grid">
    <li>Cut any genre: documentary, narrative, ad, trailer, music video, YouTube and shorts</li>
    <li>Grade log footage in a scene-referred pipeline and match any shot</li>
    <li>Mix to broadcast and streaming loudness standards</li>
    <li>Key, roto, track and composite shots nobody can spot</li>
    <li>Build motion graphics with professional easing and typography</li>
    <li>Use AI tools responsibly to work 3× faster</li>
    <li>Explain what your software does at every step</li>
    <li>Price, pitch and deliver like a professional studio</li>
  </ul>
</section>

<section class="container section narrow">
  <h2 class="section-title">Frequently asked questions</h2>
  ${faqHtml}
</section>

<section class="container section cta-band">
  <h2>Your 90-day run starts with one cut.</h2>
  <p class="muted">Free during launch. No credit card. Your progress is saved to your account.</p>
  <a class="btn btn-lg" href="/signup/">Create your free account</a>
</section>`;
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const webLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.fullName, url: site.url, potentialAction: { '@type': 'SearchAction', target: `${site.url}/search/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  await emit('/', layout({ title: site.fullName, description: site.description, urlPath: '/', body, jsonld: [orgLd, webLd, courseLd, faqLd], bodyClass: 'home' }), { priority: 1.0, changefreq: 'weekly' });
}

async function buildCurriculum() {
  const body = `
<section class="container section">
  ${breadcrumbHtml([['Home', '/'], ['Curriculum', '/curriculum/']])}
  <h1 class="page-title">The HYPERCUT curriculum</h1>
  <p class="lead">12 weeks, ${totalLessons} lessons, about ${Math.round(totalMinutes / 60)} hours of focused reading plus labs, quizzes and projects. Each week builds on the one before.</p>
  <div class="curriculum-progress" id="curriculum-progress" hidden></div>
  ${phases.map((p) => `
  <h2 class="phase-heading"><span class="phase-pill phase-${p.n}">Phase ${p.n}</span> ${esc(p.name)}</h2>
  <div class="week-list">
  ${p.weeks.map((n) => { const w = weeks[n - 1]; return `
    <article class="week-card" data-week="${n}">
      <a class="week-card-link" href="${weekPath(w)}">
        <div class="week-num">Week ${pad2(n)}</div>
        <h3>${esc(w.title)}</h3>
        <p class="muted">${esc(w.theme)}</p>
        <ul class="lesson-mini">${w.lessons.map((l, i) => `<li data-lesson="${lessonId(n, i)}">${esc(l.title)}</li>`).join('')}</ul>
        <div class="week-meta"><span>${w.lessons.length} lessons</span><span>${w.labs.length} labs</span><span>Project: ${esc(w.project.title)}</span></div>
        <div class="bar" aria-hidden="true"><span class="bar-fill" data-week-fill="${n}"></span></div>
      </a>
    </article>`; }).join('')}
  </div>`).join('')}
  <h2 class="phase-heading"><span class="phase-pill">Days 85–90</span> Capstone &amp; certification</h2>
  <p>Polish your showreel, deliver your client project, review flashcards and claim your certificate.</p>
</section>`;
  await emit('/curriculum/', layout({ title: 'Video Editing Curriculum: 12 Weeks from Beginner to Pro', description: 'The full 12-week HYPERCUT video editing syllabus: film tech, cinematography, editing theory, sound, color grading, motion graphics, VFX, trends, AI and pro delivery.', urlPath: '/curriculum/', body, jsonld: [courseLd, breadcrumbLd([['Home', '/'], ['Curriculum', '/curriculum/']])] }), { priority: 0.9, changefreq: 'weekly' });
}

function quizBlock(w) {
  const data = { week: w.n, questions: w.quiz.map((q) => ({ q: q.q, options: q.options, answer: q.answer, why: q.why })) };
  return `
<section class="quiz card" aria-labelledby="quiz-h">
  <h2 id="quiz-h">Week ${w.n} quiz</h2>
  <p class="muted">${w.quiz.length} questions. Score 80% or more to pass. You can retake it any time; your best score counts.</p>
  <form id="quiz-form" class="quiz-form" data-week="${w.n}" novalidate>
    ${w.quiz.map((q, qi) => `
    <fieldset class="quiz-q" data-q="${qi}">
      <legend><span class="qn">${qi + 1}.</span> ${esc(q.q)}</legend>
      ${q.options.map((o, oi) => `<label class="opt"><input type="radio" name="q${qi}" value="${oi}" required> <span>${esc(o)}</span></label>`).join('')}
      <p class="why" hidden></p>
    </fieldset>`).join('')}
    <div class="quiz-actions"><button class="btn" type="submit">Check answers</button><button class="btn btn-ghost" type="reset">Reset</button></div>
    <p class="quiz-result" role="status" aria-live="polite"></p>
  </form>
  <script type="application/json" id="quiz-data">${jsonEmbed(data)}</script>
</section>`;
}

async function buildWeeks() {
  for (const w of weeks) {
    const prev = weeks[w.n - 2];
    const next = weeks[w.n];
    const crumbs = [['Home', '/'], ['Curriculum', '/curriculum/'], [`Week ${w.n}`, weekPath(w)]];
    const body = `
<section class="container section">
  ${breadcrumbHtml(crumbs)}
  <p class="eyebrow">Week ${pad2(w.n)} · Phase ${phases.find((p) => p.weeks.includes(w.n)).n}</p>
  <h1 class="page-title">${esc(w.title)}</h1>
  <p class="lead">${esc(w.goal)}</p>
  <div class="two-col">
    <div>
      <section class="card">
        <h2>Outcomes</h2>
        <ul class="checks">${w.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </section>
      <section class="card">
        <h2>Lessons</h2>
        <ol class="lesson-list">${w.lessons.map((l, i) => `<li data-lesson="${lessonId(w.n, i)}"><a href="${lessonPath(w, l)}"><span class="lesson-title">${esc(l.title)}</span><span class="muted small">${l.minutes} min · ${esc(l.summary)}</span></a><span class="done-badge" aria-hidden="true">✓</span></li>`).join('')}</ol>
      </section>
      ${quizBlock(w)}
    </div>
    <aside>
      <section class="card project-card">
        <p class="eyebrow">Weekly project</p>
        <h2>${esc(w.project.title)}</h2>
        <p>${esc(w.project.brief)}</p>
        <h3 class="h4">Deliverables</h3>
        <ul class="checks">${w.project.deliverables.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
        <button class="btn btn-block" type="button" data-project-toggle="w${pad2(w.n)}">Mark project complete</button>
      </section>
      <section class="card">
        <h2 class="h3">Labs this week</h2>
        <ul class="link-list">${w.labs.map((id) => { const lab = labs.find((x) => x.id === id); return `<li><a href="/labs/${id}/"><span aria-hidden="true">${lab.icon}</span> ${esc(lab.name)}</a></li>`; }).join('')}</ul>
      </section>
    </aside>
  </div>
  <nav class="pager" aria-label="Week navigation">
    ${prev ? `<a class="pager-prev" href="${weekPath(prev)}">← Week ${prev.n}: ${esc(prev.title)}</a>` : '<span></span>'}
    ${next ? `<a class="pager-next" href="${weekPath(next)}">Week ${next.n}: ${esc(next.title)} →</a>` : '<a class="pager-next" href="/dashboard/">Claim your certificate →</a>'}
  </nav>
</section>`;
    const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', name: `Week ${w.n}: ${w.title}`, itemListElement: w.lessons.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: site.url + lessonPath(w, l), name: l.title })) };
    await emit(weekPath(w), layout({ title: `Week ${w.n}: ${w.title}`, description: `${w.goal} ${w.theme}.`, urlPath: weekPath(w), body, jsonld: [breadcrumbLd(crumbs), itemList], scripts: ['/assets/js/pages/week.js'] }), { priority: 0.8 });

    for (const [i, l] of w.lessons.entries()) {
      const id = lessonId(w.n, i);
      const lp = lessonPath(w, l);
      const flat = weeks.flatMap((ww) => ww.lessons.map((ll) => ({ w: ww, l: ll })));
      const idx = flat.findIndex((x) => x.l === l);
      const pl = flat[idx - 1];
      const nl = flat[idx + 1];
      const lcrumbs = [...crumbs, [l.title, lp]];
      const lbody = `
<div class="container lesson-layout">
  <aside class="lesson-side" aria-label="Week ${w.n} lessons">
    <p class="eyebrow"><a href="${weekPath(w)}">Week ${pad2(w.n)}</a></p>
    <p class="side-title">${esc(w.title)}</p>
    <ol class="side-lessons">${w.lessons.map((x, j) => `<li data-lesson="${lessonId(w.n, j)}"${x === l ? ' class="current"' : ''}><a href="${lessonPath(w, x)}"${x === l ? ' aria-current="page"' : ''}>${esc(x.title)}</a></li>`).join('')}</ol>
    <a class="side-quiz" href="${weekPath(w)}#quiz-h">Week ${w.n} quiz →</a>
  </aside>
  <article class="lesson" data-lesson-id="${id}">
    ${breadcrumbHtml(lcrumbs)}
    <p class="eyebrow">Week ${pad2(w.n)} · Lesson ${i + 1} · ${l.minutes} min</p>
    <h1 class="page-title">${esc(l.title)}</h1>
    <p class="lead">${esc(l.summary)}</p>
    <div class="lesson-tools">
      <button class="btn btn-sm" type="button" data-complete="${id}" aria-pressed="false">Mark complete</button>
      <button class="btn btn-sm btn-ghost" type="button" data-bookmark="${id}" aria-pressed="false">☆ Bookmark</button>
      <span class="reading-progress" aria-hidden="true"><span></span></span>
    </div>
    <div class="prose">${l.body}</div>
    <section class="card keypoints"><h2 class="h3">Key takeaways</h2><ul class="checks">${l.keyPoints.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></section>
    <section class="card exercise"><h2 class="h3">🎬 Practice drill</h2><p>${esc(l.exercise)}</p></section>
    <section class="card notes">
      <h2 class="h3"><label for="note-${id}">Your notes</label></h2>
      <textarea id="note-${id}" data-note="${id}" maxlength="5000" rows="5" placeholder="Write what clicked, what to practise, questions…"></textarea>
      <p class="muted small"><span data-note-status>Notes save automatically to your account.</span> <span data-note-count>0</span>/5000</p>
    </section>
    <nav class="pager" aria-label="Lesson navigation">
      ${pl ? `<a class="pager-prev" href="${lessonPath(pl.w, pl.l)}">← ${esc(pl.l.title)}</a>` : '<span></span>'}
      ${nl ? `<a class="pager-next" href="${lessonPath(nl.w, nl.l)}">${esc(nl.l.title)} →</a>` : `<a class="pager-next" href="${weekPath(w)}#quiz-h">Final quiz →</a>`}
    </nav>
  </article>
</div>`;
      const lessonLd = {
        '@context': 'https://schema.org', '@type': 'LearningResource', name: l.title, description: l.summary, url: site.url + lp,
        learningResourceType: 'Lesson', educationalLevel: w.n <= 4 ? 'Beginner' : w.n <= 8 ? 'Intermediate' : 'Advanced',
        timeRequired: `PT${l.minutes}M`, inLanguage: 'en', isAccessibleForFree: true, keywords: l.keyPoints.join(', '),
        isPartOf: { '@type': 'Course', name: site.fullName, url: site.url + '/curriculum/' }, datePublished: BUILD_DATE,
      };
      await emit(lp, layout({ title: l.title, description: `${l.summary} Week ${w.n} of the HYPERCUT video editing course.`, urlPath: lp, body: lbody, jsonld: [breadcrumbLd(lcrumbs), lessonLd], scripts: ['/assets/js/pages/lesson.js'], ogType: 'article' }), { priority: 0.7 });
    }
  }
}

const labTheory = {
  'color-grading': 'The controls work like the primary wheels in DaVinci Resolve and Lumetri. Lift moves shadows, gamma moves midtones, gain multiplies highlights and offset shifts everything. The scopes are calculated from the pixels you see: the waveform plots brightness by horizontal position, the parade splits out R, G and B, the vectorscope plots hue as an angle and saturation as distance from the centre, and the histogram counts pixel values.',
  'color-harmony': 'Harmonies are geometric relationships on the hue wheel. Complementary colors are 180° apart, triadic colors 120°, analogous colors ±30° and split-complementary colors 180° ±30°. Colorists use them to plan palettes for production design, wardrobe and grading.',
  'shutter-fps': 'Each frame records motion for the length of time the shutter is open. Shutter angle ÷ 360 × frame duration = exposure time. At 180° and 24 fps that is 1/48 s. Narrow angles give crisp, staccato motion and wide angles give smeared motion.',
  'dof-lens': 'Depth of field uses the circle of confusion (CoC) for the sensor: about 0.030 mm on full frame, scaled by crop factor. Hyperfocal H = f²/(N·c) + f. Near limit = s(H−f)/(H+s−2f) and far limit = s(H−f)/(H−s), or infinity when s ≥ H. Horizontal field of view = 2·atan(sensor width / 2f).',
  'composition': 'The grids are composition aids, not laws. The rule of thirds splits the frame 1/3–2/3. The golden ratio grid splits it at 0.382/0.618. Diagonals and the centre cross help with symmetry, leading lines and balance.',
  'aspect-safe-zones': 'Social platforms draw buttons, captions and profile names over your video. The safe-zone overlays approximate those areas. Keep faces and text in the clear central region. Title-safe (90%) and action-safe (93%) are broadcast conventions.',
  'bitrate-calculator': 'File size = bitrate × duration. Mbps is megabits per second, so divide by 8 for megabytes per second. The calculator scales the published codec data rates by resolution and frame rate. Real files vary with image complexity.',
  'timecode': 'Non-drop timecode counts frames exactly. Drop-frame (29.97/59.94) skips frame labels 0–1 (or 0–3 at 59.94) at the start of each minute, except every tenth minute, so the timecode stays within a frame or two of wall-clock time.',
  'easing': 'CSS and most animation tools describe easing with a cubic Bézier from (0,0) to (1,1) with two control points (x1,y1) and (x2,y2). Steep slopes mean fast motion and flat slopes mean slow motion. Values of y outside 0–1 create overshoot.',
  'beat-sync': 'Frames per beat = fps × 60 ÷ BPM. When the result is not a whole number, cut on the nearest frame and spread the rounding over several cuts so you do not drift off the beat. Bars (4 beats) and phrases (4–8 bars) are the natural places for big cuts.',
  'eq-trainer': 'A peaking EQ boosts a band around a centre frequency. Training with pink noise, which has equal energy per octave, teaches you to recognise each region: mud (250 Hz), honk (1 kHz), presence (4 kHz) and air (10 kHz). Mixers use this to fix problems in seconds.',
  'chroma-key': 'Keyers measure how far each pixel is from the key color. Tolerance sets which pixels become fully transparent and softness sets the partial edge. Spill suppression limits green to the average of red and blue so edges are not tinted green.',
  'blend-modes': 'Blend modes are per-pixel formulas combining a top layer (a) with the layer below (b), using values from 0 to 1. Multiply = a·b, Screen = 1−(1−a)(1−b), Difference = |a−b|. The canvas uses the browser\'s compositing engine, which follows the same W3C formulas used by most editing software.',
  'exposure-triangle': 'Exposure value EV100 = log2(N²/t) − log2(ISO/100). Each ND stop adds 1 EV. If the scene\'s light level (EV) is higher than your settings\' EV, the image is overexposed by the difference in stops. In video the shutter is fixed by the 180° rule (t = 1/(2·fps)), so you control exposure with the aperture, ND filters and ISO. The aperture also sets depth of field, and ISO adds noise.',
  'white-balance': 'A light source has a color temperature in Kelvin. The camera\'s white balance tells it which temperature should render as neutral. The lab models light color with a blackbody approximation: the image gains are light RGB ÷ white-balance RGB. When they match, a grey card is grey. The eyedropper works backwards from a neutral sample to estimate the light, exactly like a white-balance picker in your editor.',
  'lighting': 'The lab shades a 3D head per pixel (Lambert diffuse plus specular and rim terms) from a key light at your chosen angle and height, a fill light on the opposite side, a back or rim light, and a background light. Key:fill ratio = (key + fill) ÷ fill. 2:1 is bright and commercial, 4:1 is natural drama, and 8:1 or more is noir. Every stop of contrast doubles the ratio.',
  'compression': 'This is the real intra-frame compression pipeline used by JPEG, Motion JPEG and, in refined forms, ProRes, H.264 and HEVC. Pixels are converted to Y′CbCr, color is optionally subsampled (4:2:2 or 4:2:0), each 8×8 block is transformed with a DCT, coefficients are divided by a quantization matrix and rounded (the lossy step), and the image is rebuilt. The percentage of non-zero coefficients is a good proxy for bitrate.',
  'trim-tools': 'Each clip references a range of its source media (in to out) and has unused "handles" before and after. Ripple changes one side of a clip and shifts everything after it. Roll moves a cut between two clips. Slip moves the source range inside a fixed slot. Slide moves a clip while its neighbours absorb the change. No trim can use frames beyond the source media, which is why handles matter.',
  'kuleshov': 'Lev Kuleshov\'s experiments in the 1920s showed audiences the same neutral close-up intercut with different shots, and they "saw" different emotions in the actor. The meaning is created by the juxtaposition, not by either shot alone. Every reaction shot and cutaway you place uses this effect.',
  'loudness-meter': 'Loudness is measured to ITU-R BS.1770-4. Each channel is K-weighted (a high-shelf "head" filter plus a high-pass), mean square is taken over 400 ms blocks overlapping by 75%, and blocks below −70 LUFS (absolute gate) and then 10 LU below the average (relative gate) are discarded. Integrated loudness = −0.691 + 10·log10 of the gated mean. A stereo 1 kHz tone at −20 dBFS reads −20 LUFS.',
  'export-settings': 'Settings follow the platforms\' published upload recommendations and broadcast practice: H.264 High profile at a constrained VBR for web, ProRes 422 HQ for masters, Rec.709 color tags, 48 kHz audio and each platform\'s loudness target. The FFmpeg command applies the same settings with free software.',
  'captions-srt': 'Professional subtitle guidelines (Netflix, BBC and others) recommend 1–2 lines, about 42 characters per line (shorter for vertical video), and a reading speed of around 15–20 characters per second. The tool breaks your text at word and sentence boundaries, times each caption in proportion to its length, and flags captions that are too fast to read.',
  'rate-calculator': 'Day rate = (take-home income grossed up for tax + business expenses) ÷ billable days. Billable days = working weeks × days per week × utilisation. Quotes estimate editing hours from the finished duration and project type, with add-ons for grading, sound and extra revision rounds.',
  'shot-list': 'A shot list is the bridge between script and edit. Planning coverage (wide for geography, mediums for performance, close-ups for emotion, inserts for rhythm) makes sure the editor has the shots needed to cut the scene. Exported CSV cells are protected against spreadsheet formula injection.',
  'shortcut-trainer': 'Speed comes from muscle memory. Shortcuts listed are default mappings, and some differ by OS and version, so check your app\'s keyboard customisation panel. On macOS, Cmd replaces Ctrl.',
};

async function buildLabs() {
  const cats = [...new Set(labs.map((l) => l.cat))];
  const body = `
<section class="container section">
  ${breadcrumbHtml([['Home', '/'], ['Labs', '/labs/']])}
  <h1 class="page-title">Interactive labs</h1>
  <p class="lead">Hands-on tools that turn theory into instinct. Everything runs in your browser, and images you load stay on your device.</p>
  <p><a href="/toolkit/">Looking for the software and hardware editors need? See the Editor's Toolkit →</a></p>
  ${cats.map((c) => `<h2 class="phase-heading">${esc(c)}</h2><div class="lab-grid">${labs.filter((l) => l.cat === c).map((l) => `<a class="lab-card" href="/labs/${l.id}/" data-lab-card="${l.id}"><span class="lab-icon" aria-hidden="true">${l.icon}</span><strong>${esc(l.name)}</strong>${l.lesson ? '<span class="tag essential">Interactive lesson · missions</span>' : ''}<span class="muted small">${esc(l.blurb)}</span></a>`).join('')}</div>`).join('')}
</section>`;
  await emit('/labs/', layout({ title: 'Interactive Video Editing Labs', description: `${labs.length} free interactive labs: color grading with live scopes, chroma key, depth of field, timecode, bitrate, EQ ear training, easing curves and more.`, urlPath: '/labs/', body, jsonld: [breadcrumbLd([['Home', '/'], ['Labs', '/labs/']])] }), { priority: 0.9 });

  for (const lab of labs) {
    const crumbs = [['Home', '/'], ['Labs', '/labs/'], [lab.name, `/labs/${lab.id}/`]];
    const usedIn = weeks.filter((w) => w.labs.includes(lab.id));
    const body = `
<section class="container section">
  ${breadcrumbHtml(crumbs)}
  <p class="eyebrow">${esc(lab.cat)} lab</p>
  <h1 class="page-title"><span aria-hidden="true">${lab.icon}</span> ${esc(lab.name)}</h1>
  <p class="lead">${esc(lab.blurb)}</p>
  <div id="lab-root" class="lab-root card" data-lab="${lab.id}"><noscript>This lab needs JavaScript enabled.</noscript><p class="muted lab-loading">Loading lab…</p></div>
  <section class="card"><h2 class="h3">How it works</h2><p>${esc(labTheory[lab.id])}</p>
  ${usedIn.length ? `<p class="muted">Used in: ${usedIn.map((w) => `<a href="${weekPath(w)}">Week ${w.n}: ${esc(w.title)}</a>`).join(', ')}</p>` : ''}</section>
</section>`;
    const appLd = { '@context': 'https://schema.org', '@type': 'WebApplication', name: lab.name, description: lab.blurb, url: `${site.url}/labs/${lab.id}/`, applicationCategory: 'EducationalApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' } };
    await emit(`/labs/${lab.id}/`, layout({ title: `${lab.name}: Free Interactive Tool`, description: lab.blurb, urlPath: `/labs/${lab.id}/`, body, jsonld: [breadcrumbLd(crumbs), appLd], scripts: [`/assets/js/labs/${lab.id}.js`] }), { priority: 0.8 });
  }
}

async function buildPlaybook() {
  const cats = [...new Set(scenarios.map((s) => s.category))];
  const tl = { premiere: 'Premiere Pro', resolve: 'DaVinci Resolve', fcp: 'Final Cut Pro', capcut: 'CapCut' };
  const body = `
<section class="container section">
  ${breadcrumbHtml([['Home', '/'], ['Scenario Playbook', '/playbook/']])}
  <h1 class="page-title">Real-world scenario playbook</h1>
  <p class="lead">${scenarios.length} problems editors run into on real jobs, each with the diagnosis, the fix in order, where to find the tools in each editor, and how to avoid it next time.</p>
  <div class="filter-bar" role="search">
    <label class="sr-only" for="pb-search">Search scenarios</label>
    <input id="pb-search" type="search" placeholder="Describe your problem… e.g. “wind”, “orange skin”, “lag”" autocomplete="off" maxlength="100">
    <div class="chips" role="group" aria-label="Filter by category"><button type="button" class="chip active" data-cat="all" aria-pressed="true">All</button>${cats.map((c) => `<button type="button" class="chip" data-cat="${c}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>
  </div>
  <p class="muted small" id="pb-count" role="status" aria-live="polite"></p>
  <div class="scenario-list">
  ${scenarios.map((s) => `
    <details class="scenario card" id="${s.id}" data-cat="${s.category}" data-text="${esc((s.title + ' ' + s.symptoms + ' ' + s.diagnosis + ' ' + s.fix.join(' ')).toLowerCase())}">
      <summary><span class="sev sev-${s.severity}">${esc(s.severity)}</span><span class="cat-tag">${esc(s.category)}</span><h2 class="scenario-title">${esc(s.title)}</h2></summary>
      <div class="scenario-body">
        <p><strong>Symptoms:</strong> ${esc(s.symptoms)}</p>
        <p><strong>Diagnosis:</strong> ${esc(s.diagnosis)}</p>
        <h3 class="h4">Fix it, step by step</h3>
        <ol>${s.fix.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>
        <h3 class="h4">Where to find it</h3>
        <dl class="tool-map">${Object.entries(s.tools).map(([k, v]) => `<div><dt>${tl[k]}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p class="callout tip"><strong>Prevent it next time:</strong> ${esc(s.prevention)}</p>
        <p><a class="small" href="/playbook/#${s.id}">Link to this scenario</a></p>
      </div>
    </details>`).join('')}
  </div>
</section>`;
  const howtoLd = scenarios.slice(0, 10).map((s) => ({ '@context': 'https://schema.org', '@type': 'HowTo', name: s.title, description: s.diagnosis, step: s.fix.map((f, i) => ({ '@type': 'HowToStep', position: i + 1, text: f })) }));
  await emit('/playbook/', layout({ title: 'Video Editing Problems & Fixes: Scenario Playbook', description: 'Fix shaky footage, wind noise, mixed white balance, audio drift, flicker, moiré, slow playback, copyright claims and more, with steps for Premiere, Resolve, Final Cut and CapCut.', urlPath: '/playbook/', body, jsonld: [breadcrumbLd([['Home', '/'], ['Scenario Playbook', '/playbook/']]), ...howtoLd], scripts: ['/assets/js/pages/playbook.js'] }), { priority: 0.9 });
}

async function buildSoftware() {
  const keys = Object.keys(scoreLabels);
  const body = `
<section class="container section">
  ${breadcrumbHtml([['Home', '/'], ['Software Compared', '/software/']])}
  <h1 class="page-title">Video editing software compared</h1>
  <p class="lead">Every major editor, honestly compared: what each is best at, pros, cons, platforms and who uses it. Pick two and get great at them.</p>
  <p class="muted small">${esc(softwareNote)}</p>
  <div class="filter-bar">
    <label for="sw-os">Platform</label>
    <select id="sw-os"><option value="all">All platforms</option><option>Windows</option><option>macOS</option><option>Linux</option><option>iOS</option><option>Android</option><option>Web</option></select>
    <label for="sw-sort">Sort by</label>
    <select id="sw-sort"><option value="name">Name</option>${keys.map((k) => `<option value="${k}">${esc(scoreLabels[k])}</option>`).join('')}</select>
  </div>
  <div class="table-wrap">
  <table class="score-table" id="sw-table">
    <caption>Scores out of 10 (editorial ratings for each discipline)</caption>
    <thead><tr><th scope="col">Software</th>${keys.map((k) => `<th scope="col">${esc(scoreLabels[k])}</th>`).join('')}</tr></thead>
    <tbody>${software.map((s) => `<tr data-id="${s.id}" data-os="${esc(s.os.join('|'))}" ${keys.map((k) => `data-${k}="${s.scores[k]}"`).join(' ')}><th scope="row"><a href="#sw-${s.id}">${esc(s.name)}</a></th>${keys.map((k) => `<td><span class="score s${s.scores[k]}">${s.scores[k]}</span></td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  </div>
  <div class="software-grid">
  ${software.map((s) => `
  <article class="card software" id="sw-${s.id}" data-os="${esc(s.os.join('|'))}">
    <h2>${esc(s.name)}</h2>
    <p class="muted small">${esc(s.vendor)} · ${esc(s.category)}</p>
    <dl class="sw-meta"><div><dt>Platforms</dt><dd>${esc(s.os.join(', '))}</dd></div><div><dt>Pricing</dt><dd>${esc(s.price)}</dd></div><div><dt>Level</dt><dd>${esc(s.level)}</dd></div></dl>
    <p><strong>Best for:</strong> ${esc(s.bestFor.join(' · '))}</p>
    <div class="pc"><div><h3 class="h4 pro">Pros</h3><ul>${s.pros.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div><div><h3 class="h4 con">Cons</h3><ul>${s.cons.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div></div>
  </article>`).join('')}
  </div>
  <section class="card"><h2>Quick decision guide</h2>
  <ul class="checks"><li><strong>Want one free tool that does everything?</strong> DaVinci Resolve.</li><li><strong>Want agency/YouTube jobs?</strong> Premiere Pro + After Effects.</li><li><strong>On a Mac and want speed?</strong> Final Cut Pro.</li><li><strong>Aiming for Hollywood feature/TV editing?</strong> Avid Media Composer.</li><li><strong>Shorts and trends?</strong> CapCut, then graduate to Premiere/Resolve.</li><li><strong>VFX career?</strong> Nuke + Blender.</li><li><strong>Podcasts and talking heads?</strong> Descript or Premiere text-based editing.</li></ul></section>
</section>`;
  const listLd = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Video editing software compared', itemListElement: software.map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'SoftwareApplication', name: s.name, applicationCategory: 'MultimediaApplication', operatingSystem: s.os.join(', ') } })) };
  await emit('/software/', layout({ title: 'Best Video Editing Software Compared: Pros & Cons', description: 'DaVinci Resolve vs Premiere Pro vs Final Cut Pro vs Avid vs CapCut vs After Effects vs Nuke: pros, cons, platforms, pricing models and who each one is for.', urlPath: '/software/', body, jsonld: [breadcrumbLd([['Home', '/'], ['Software Compared', '/software/']]), listLd], scripts: ['/assets/js/pages/software.js'] }), { priority: 0.9 });
}

async function buildEffects() {
  const body = `
<section class="container section">
  ${breadcrumbHtml([['Home', '/'], ['Effects Cookbook', '/effects/']])}
  <h1 class="page-title">The effects cookbook</h1>
  <p class="lead">${effects.length} trending effects and transitions as step-by-step recipes. Learn why each one works, then make it your own.</p>
  <div class="effects-grid">
  ${effects.map((e) => {
    const w = weeks[e.week - 1];
    return `
  <article class="card effect" id="${e.id}">
    <div class="effect-head"><h2 class="h3">${esc(e.name)}</h2><span class="difficulty" aria-label="Difficulty ${e.difficulty} of 4">${'●'.repeat(e.difficulty)}${'○'.repeat(4 - e.difficulty)}</span></div>
    <p class="muted small">Seen in: ${esc(e.trend)}</p>
    <ol>${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <a class="small" href="${weekPath(w)}">Theory: Week ${w.n}, ${esc(w.title)} →</a>
  </article>`; }).join('')}
  </div>
</section>`;
  await emit('/effects/', layout({ title: 'Trending Video Effects & Transitions: Step-by-Step Recipes', description: 'How to make speed ramps, whip pans, zoom transitions, text behind subject, glitch, datamosh, film emulation, VHS, light leaks and more.', urlPath: '/effects/', body, jsonld: [breadcrumbLd([['Home', '/'], ['Effects Cookbook', '/effects/']])] }), { priority: 0.9 });
}

async function buildToolkit() {
  const crumbs = [['Home', '/'], ['Editor\'s Toolkit', '/toolkit/']];
  const priceLabel = { free: 'Free', freemium: 'Free tier', paid: 'Paid', subscription: 'Subscription' };
  const card = (t) => {
    const w = weeks[t.week - 1];
    return `<article class="card tool-card" id="tool-${t.id}" data-tool="${t.id}" data-tier="${t.tier}" data-price="${t.price}" data-focus="${t.focus.join(' ')}">
      <h3>${esc(t.name)}</h3>
      <div class="tags"><span class="tag ${t.tier === 'essential' ? 'essential' : ''}">${t.tier === 'essential' ? 'Essential' : t.tier === 'recommended' ? 'Recommended' : 'Pro upgrade'}</span><span class="tag ${t.price === 'free' ? 'free' : ''}">${priceLabel[t.price]}</span></div>
      <p class="small">${esc(t.what)}</p>
      <p class="small muted"><strong>Why you need it:</strong> ${esc(t.why)}</p>
      <p class="small">${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Official site ↗</a> · ` : ''}<a href="${weekPath(w)}">Used in Week ${w.n}</a></p>
      <label class="have"><input type="checkbox" data-have="${t.id}"> I have this</label>
    </article>`;
  };
  const builtIn = labs.filter((l) => l.cat === 'Pro Tools');
  const body = `
<section class="container section">
  ${breadcrumbHtml(crumbs)}
  <h1 class="page-title">The editor's toolkit</h1>
  <p class="lead">The software, utilities, plugins, asset libraries and hardware that working editors rely on. Everything here is explained in the course, and most of the essentials are free.</p>
  <section class="card" aria-labelledby="kit-h">
    <h2 id="kit-h" class="h3">🧰 Build your kit</h2>
    <p class="muted">Pick your budget and the work you want to do. The list below filters to what you need, and you can tick off what you already own.</p>
    <div class="filter-bar">
      <label for="kit-budget">Budget</label><select id="kit-budget">${BUDGETS.map(([v, l]) => `<option value="${v}"${v === 'starter' ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
      <label for="kit-focus">Focus</label><select id="kit-focus">${FOCUSES.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select>
      <label for="kit-all"><input type="checkbox" id="kit-all"> Show every tool</label>
    </div>
    <p id="kit-summary" class="muted small" role="status" aria-live="polite"></p>
  </section>
  ${TOOL_CATEGORIES.map(([id, name, blurb]) => `<section class="tool-cat" data-cat="${id}"><h2 class="phase-heading">${esc(name)}</h2><p class="muted">${esc(blurb)}</p><div class="kit-grid">${tools.filter((t) => t.cat === id).map(card).join('')}</div></section>`).join('')}
  <section class="card"><h2 class="h3">Built into HYPERCUT (free, in your browser)</h2><div class="lab-grid">${builtIn.map((l) => `<a class="lab-card" href="/labs/${l.id}/"><span class="lab-icon" aria-hidden="true">${l.icon}</span><strong>${esc(l.name)}</strong><span class="muted small">${esc(l.blurb)}</span></a>`).join('')}</div></section>
  <p class="muted small">HYPERCUT has no affiliation with any vendor listed and earns nothing from these links. Prices and plans change, so check each vendor's site. Product names are trademarks of their owners.</p>
</section>`;
  const listLd = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Essential video editing tools', itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, description: t.what })) };
  await emit('/toolkit/', layout({ title: 'Essential Video Editing Tools, Plugins & Hardware', description: 'The essential video editing toolkit: free utilities, audio repair, color calibration, plugins, review tools, licensed music and hardware, with a kit builder for every budget.', urlPath: '/toolkit/', body, jsonld: [breadcrumbLd(crumbs), listLd], scripts: ['/assets/js/pages/toolkit.js'] }), { priority: 0.9 });
}

async function buildEngine() {
  const body = `
<section class="container section narrow">
  ${breadcrumbHtml([['Home', '/'], ['Inside the Engine', '/engine/']])}
  <h1 class="page-title">Inside the engine: from photon to pixel</h1>
  <p class="lead">What really happens to your video, in order, from the moment light hits the sensor to the moment it plays on someone's phone. Once you understand this, every setting in every app makes sense.</p>
  <nav class="toc card" aria-label="Chapters"><h2 class="h4">Pipeline</h2><ol class="pipeline">${engineChapters.map((c) => `<li><a href="#${c.id}">${esc(c.title.replace(/^\d+\.\s*/, ''))}</a></li>`).join('')}</ol></nav>
  ${engineChapters.map((c) => `<section class="engine-chapter" id="${c.id}"><h2>${esc(c.title)}</h2><div class="prose">${c.body}</div></section>`).join('')}
</section>`;
  const articleLd = { '@context': 'https://schema.org', '@type': 'TechArticle', headline: 'How video editing software works: from photon to pixel', description: 'A sequential deep dive into sensors, codecs, NLE playback engines, GPU pipelines, color management, audio engines, rendering and AI.', url: site.url + '/engine/', datePublished: BUILD_DATE, author: { '@type': 'Organization', name: site.fullName } };
  await emit('/engine/', layout({ title: 'How Video Editing Software Works: Inside the Engine', description: 'A step-by-step look at how video editing works under the hood: sensors, debayering, codecs, GOPs, NLE playback engines, GPU pipelines, color management, audio, export and AI.', urlPath: '/engine/', body, jsonld: [breadcrumbLd([['Home', '/'], ['Inside the Engine', '/engine/']]), articleLd], ogType: 'article' }), { priority: 0.8 });
}

async function buildGlossary() {
  const sorted = [...glossary].sort((a, b) => a[0].localeCompare(b[0]));
  const letters = [...new Set(sorted.map(([t]) => t[0].toUpperCase()))];
  const body = `
<section class="container section narrow">
  ${breadcrumbHtml([['Home', '/'], ['Glossary', '/glossary/']])}
  <h1 class="page-title">Video editing glossary</h1>
  <p class="lead">${glossary.length} essential terms. Drill them in the <a href="/flashcards/">flashcard trainer</a>.</p>
  <label class="sr-only" for="gl-search">Filter terms</label>
  <input id="gl-search" type="search" placeholder="Filter terms…" maxlength="60" autocomplete="off">
  <nav class="letters" aria-label="Jump to letter">${letters.map((l) => `<a href="#letter-${l}">${l}</a>`).join('')}</nav>
  <dl class="glossary">${letters.map((L) => `<div class="gl-group" id="letter-${L}"><h2 class="gl-letter">${L}</h2>${sorted.filter(([t]) => t[0].toUpperCase() === L).map(([t, d]) => `<div class="gl-item" id="term-${slugify(t)}"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('')}</div>`).join('')}</dl>
</section>`;
  const termSetLd = { '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'HYPERCUT video editing glossary', hasDefinedTerm: sorted.map(([t, d]) => ({ '@type': 'DefinedTerm', name: t, description: d, url: `${site.url}/glossary/#term-${slugify(t)}` })) };
  await emit('/glossary/', layout({ title: 'Video Editing Glossary: Terms Every Editor Must Know', description: `Definitions of ${glossary.length} video editing, color grading, audio and VFX terms, from A-roll to white balance.`, urlPath: '/glossary/', body, jsonld: [breadcrumbLd([['Home', '/'], ['Glossary', '/glossary/']]), termSetLd], scripts: ['/assets/js/pages/glossary.js'] }), { priority: 0.7 });
}

function appPage(urlPath, title, description, inner, script, { index = false } = {}) {
  return emit(urlPath, layout({ title, description, urlPath, noindex: !index, body: `<section class="container section">${inner}</section>`, scripts: script ? [script] : [] }), { index, priority: 0.5 });
}

async function buildAppPages() {
  const authForm = (mode) => `
<div class="auth-wrap">
  <div class="card auth-card">
    <h1 class="page-title">${mode === 'signup' ? 'Start your 90-day run' : 'Welcome back'}</h1>
    <p class="muted">${mode === 'signup' ? 'Free account. Track progress, XP, streaks, notes and earn your certificate.' : 'Log in to continue where you left off.'}</p>
    <form id="${mode}-form" class="form" novalidate>
      ${mode === 'signup' ? '<div class="field"><label for="name">Name</label><input id="name" name="name" type="text" autocomplete="name" required maxlength="60"></div>' : ''}
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="254" inputmode="email"></div>
      <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required minlength="8" maxlength="128">
      ${mode === 'signup' ? '<p class="hint muted small" id="pw-hint">At least 8 characters, including a letter and a number.</p><div class="pw-meter" aria-hidden="true"><span></span></div>' : ''}</div>
      ${mode === 'login' ? '<label class="check"><input type="checkbox" name="remember" id="remember"> Keep me logged in for 30 days</label>' : '<label class="check"><input type="checkbox" name="terms" id="terms" required> I agree to the <a href="/terms/">terms</a> and <a href="/privacy/">privacy notice</a></label>'}
      <p class="form-error" role="alert" aria-live="assertive"></p>
      <button class="btn btn-block" type="submit">${mode === 'signup' ? 'Create account' : 'Log in'}</button>
    </form>
    <p class="muted small">${mode === 'signup' ? 'Already have an account? <a href="/login/">Log in</a>' : 'New here? <a href="/signup/">Create a free account</a>'}</p>
  </div>
</div>`;
  await appPage('/login/', 'Log in', 'Log in to HYPERCUT to continue your 90-day video editing journey and keep your progress, XP and notes.', authForm('login'), '/assets/js/pages/auth.js');
  await appPage('/signup/', 'Create your free account', 'Create a free HYPERCUT account to track your video editing course progress.', authForm('signup'), '/assets/js/pages/auth.js');

  await appPage('/dashboard/', 'Dashboard', 'Your HYPERCUT dashboard: lessons completed, XP, level, streak, badges, notes and certificate progress.', `
<h1 class="page-title" id="page-h1">Your dashboard</h1>
<div id="dashboard-root" class="dashboard"><noscript>The dashboard needs JavaScript.</noscript><p class="muted">Loading your dashboard…</p></div>`, '/assets/js/pages/dashboard.js');

  await appPage('/account/', 'Account settings', 'Manage your HYPERCUT account: profile, password, sessions, data export and account deletion.', `
<div class="narrow">
  <h1 class="page-title">Account settings</h1>
  <div id="account-root"><p class="muted">Loading…</p></div>
  <section class="card"><h2 class="h3">Change password</h2>
    <form id="pw-form" class="form" novalidate>
      <div class="field"><label for="cur-pw">Current password</label><input id="cur-pw" type="password" autocomplete="current-password" required maxlength="128"></div>
      <div class="field"><label for="new-pw">New password</label><input id="new-pw" type="password" autocomplete="new-password" required minlength="8" maxlength="128"></div>
      <p class="form-error" role="alert"></p><button class="btn" type="submit">Update password</button>
    </form></section>
  <section class="card"><h2 class="h3">Your data</h2><p class="muted">Download everything stored for your account as JSON, or delete it permanently.</p>
    <div class="row-gap"><button class="btn btn-ghost" type="button" id="export-data">Export my data</button><button class="btn btn-danger" type="button" id="delete-account">Delete account</button></div></section>
  <section class="card"><h2 class="h3">Sessions</h2><button class="btn btn-ghost" type="button" id="logout-all">Log out of all sessions</button></section>
</div>`, '/assets/js/pages/account.js');

  // 90-day plan built from weeks
  const plan = [];
  for (const w of weeks) {
    w.lessons.forEach((l, i) => plan.push({ day: plan.length + 1, week: w.n, type: 'lesson', title: l.title, href: lessonPath(w, l), id: lessonId(w.n, i) }));
    plan.push({ day: plan.length + 1, week: w.n, type: 'lab', title: `Labs + Week ${w.n} quiz`, href: weekPath(w) + '#quiz-h', id: `quiz-${w.n}` });
    plan.push({ day: plan.length + 1, week: w.n, type: 'project', title: `Project: ${w.project.title}`, href: weekPath(w), id: `project-w${pad2(w.n)}` });
  }
  const capstone = ['Capstone: plan your showreel', 'Capstone: edit the showreel', 'Capstone: color & sound polish', 'Capstone: client project delivery', 'Flashcard mastery review', 'Certification day'];
  capstone.forEach((t, i) => plan.push({ day: plan.length + 1, week: 13, type: i === 5 ? 'cert' : 'capstone', title: t, href: i === 4 ? '/flashcards/' : i === 5 ? '/dashboard/' : '/week/12-pro-workflow/', id: `cap-${i + 1}` }));
  await writeFile(path.join(DIST, 'plan.json'), JSON.stringify(plan));
  await appPage('/planner/', '90-Day Video Editing Study Plan', 'A day-by-day 90-day plan to learn video editing from beginner to pro, with streak tracking.', `
${breadcrumbHtml([['Home', '/'], ['90-Day Planner', '/planner/']])}
<h1 class="page-title">Your 90-day plan</h1>
<p class="lead">One focused session a day. Tick off each day to build your streak. Days with lessons, quizzes or projects tick themselves when you complete them.</p>
<div id="planner-root" class="planner"><noscript>
<ol>${plan.map((d) => `<li><a href="${d.href}">Day ${d.day}: ${esc(d.title)}</a></li>`).join('')}</ol></noscript><p class="muted">Loading plan…</p></div>`, '/assets/js/pages/planner.js', { index: true });

  await writeFile(path.join(DIST, 'glossary.json'), JSON.stringify(glossary.map(([t, d]) => ({ t, d, id: slugify(t) }))));
  await appPage('/flashcards/', 'Video Editing Flashcards (Spaced Repetition)', 'Memorise essential video editing terms with spaced-repetition flashcards.', `
${breadcrumbHtml([['Home', '/'], ['Flashcards', '/flashcards/']])}
<h1 class="page-title">Flashcards</h1>
<p class="lead">Spaced repetition using the Leitner system. Cards you know come back less often and cards you miss come back sooner.</p>
<div id="fc-root" class="flashcards"><noscript>Flashcards need JavaScript. See the <a href="/glossary/">glossary</a>.</noscript></div>`, '/assets/js/pages/flashcards.js', { index: true });

  await appPage('/search/', 'Search', 'Search every HYPERCUT lesson, lab, scenario, effect recipe, software review and glossary term.', `
<h1 class="page-title">Search the course</h1>
<form class="search-form" role="search" action="/search/" method="get"><label class="sr-only" for="q">Search</label><input id="q" name="q" type="search" placeholder="Search lessons, labs, scenarios, effects, terms…" maxlength="100" autocomplete="off"></form>
<p class="muted small" id="search-count" role="status" aria-live="polite"></p>
<ol id="search-results" class="search-results"></ol>`, '/assets/js/pages/search.js');

  await appPage('/certificate/', 'Certificate', 'Download your HYPERCUT: Edit God Mode certificate after completing every lesson and quiz.', `
<h1 class="page-title center" id="page-h1">Your certificate</h1>
<div id="cert-root"><p class="muted center">Checking your progress…</p></div>`, '/assets/js/pages/certificate.js');
}

async function buildStatic() {
  const prosePage = (p, title, desc, html) => emit(p, layout({ title, description: desc, urlPath: p, body: `<section class="container section narrow">${breadcrumbHtml([['Home', '/'], [title, p]])}<h1 class="page-title">${esc(title)}</h1><div class="prose">${html}</div></section>` }), { priority: 0.4, changefreq: 'yearly' });
  await prosePage('/about/', 'About HYPERCUT', 'Why HYPERCUT exists and how the 90-day video editing course is designed to take you from beginner to pro.', `
<p><strong>HYPERCUT: Edit God Mode</strong> is a 90-day course that takes you from your first cut to a professional, versatile editor. Most editors learn from scattered tutorials and end up with gaps. HYPERCUT is built so that each topic depends on the ones before it. You learn how pixels and codecs work before you learn effects, and the craft before the trends.</p>
<h2>Teaching principles</h2>
<ul><li><strong>Concepts before buttons:</strong> software changes, principles don't.</li><li><strong>Learn by doing:</strong> every lesson has a practice drill, every week has a project and a quiz.</li><li><strong>Interactive intuition:</strong> labs make abstract theory visible.</li><li><strong>Real-world readiness:</strong> the Scenario Playbook covers the problems you will actually face.</li><li><strong>Ethics:</strong> licensing, consent and honest editing are part of being a pro.</li></ul>`);
  await prosePage('/privacy/', 'Privacy notice', 'How HYPERCUT handles your data: what is stored, where it lives, and how to export or delete it.', `
<p>Last updated ${BUILD_DATE}.</p>
<h2>What we store</h2><p>When you create an account, your name, email, a salted password hash (we never store your password), and your learning progress (completed lessons, quiz scores, notes, bookmarks, planner, flashcards, XP and badges) are stored.</p>
<h2>Where it is stored</h2><p>In this version, all account and progress data is stored <strong>only in your browser's local storage on this device</strong>. It is not sent to any server. Clearing your browser data deletes it. Anyone with access to this browser profile could access it, so use your own device.</p>
<h2>Images in labs</h2><p>Images you load into labs are processed in your browser and never uploaded.</p>
<h2>Your rights</h2><p>You can export all your data or delete your account at any time from <a href="/account/">Account settings</a>.</p>
<h2>Cookies & tracking</h2><p>HYPERCUT uses no third-party cookies, trackers or advertising scripts.</p>`);
  await prosePage('/terms/', 'Terms of use', 'Terms of use for the HYPERCUT video editing course, including content use, licensing and data storage.', `
<p>Last updated ${BUILD_DATE}.</p>
<p>HYPERCUT course content is provided for personal educational use. Do not republish the lesson content without permission. Third-party software names are trademarks of their owners and are mentioned only for educational comparison. Information about software features and pricing may change, so always check the vendor. Use music, footage, voices and likenesses only with the right licences and consent.</p>
<p>The service is provided "as is", without warranties. Progress data is stored locally in your browser in this version and may be lost if browser data is cleared.</p>`);

  await writeFile(path.join(DIST, '404.html'), layout({ title: 'Page not found', description: 'This page could not be found. Browse the HYPERCUT video editing curriculum, labs and playbook instead.', urlPath: '/404.html', noindex: true, body: `<section class="container section narrow center"><p class="eyebrow">Error 404</p><h1 class="page-title">Missing frame.</h1><p class="lead">This page was cut from the final edit.</p><p><a class="btn" href="/">Back to home</a> <a class="btn btn-ghost" href="/search/">Search</a></p></section>` }));
}

async function buildSearchIndex() {
  const idx = [];
  for (const w of weeks) {
    idx.push({ t: `Week ${w.n}: ${w.title}`, u: weekPath(w), k: 'Week', s: w.goal, b: `${w.theme} ${w.outcomes.join(' ')} ${w.project.title}` });
    w.lessons.forEach((l) => idx.push({ t: l.title, u: lessonPath(w, l), k: 'Lesson', s: l.summary, b: stripTags(l.body).slice(0, 4000) + ' ' + l.keyPoints.join(' ') }));
  }
  labs.forEach((l) => idx.push({ t: l.name, u: `/labs/${l.id}/`, k: 'Lab', s: l.blurb, b: labTheory[l.id] }));
  scenarios.forEach((s) => idx.push({ t: s.title, u: `/playbook/#${s.id}`, k: 'Scenario', s: s.symptoms, b: `${s.diagnosis} ${s.fix.join(' ')} ${s.prevention}` }));
  effects.forEach((e) => idx.push({ t: e.name, u: `/effects/#${e.id}`, k: 'Effect', s: e.trend, b: e.steps.join(' ') }));
  software.forEach((s) => idx.push({ t: s.name, u: `/software/#sw-${s.id}`, k: 'Software', s: s.category, b: `${s.pros.join(' ')} ${s.cons.join(' ')} ${s.bestFor.join(' ')}` }));
  glossary.forEach(([t, d]) => idx.push({ t, u: `/glossary/#term-${slugify(t)}`, k: 'Term', s: d, b: '' }));
  tools.forEach((t) => idx.push({ t: t.name, u: `/toolkit/#tool-${t.id}`, k: 'Tool', s: t.what, b: t.why }));
  engineChapters.forEach((c) => idx.push({ t: c.title, u: `/engine/#${c.id}`, k: 'Engine', s: stripTags(c.body).slice(0, 160), b: stripTags(c.body) }));
  await writeFile(path.join(DIST, 'search-index.json'), JSON.stringify(idx));
  // Course map consumed by client (ids, titles, paths)
  const map = weeks.map((w) => ({ n: w.n, title: w.title, path: weekPath(w), quizCount: w.quiz.length, lessons: w.lessons.map((l, i) => ({ id: lessonId(w.n, i), title: l.title, path: lessonPath(w, l), minutes: l.minutes })) }));
  await writeFile(path.join(DIST, 'course-map.json'), JSON.stringify({ weeks: map, labs: labs.map((l) => ({ id: l.id, name: l.name, icon: l.icon })) }));
}

async function buildMeta() {
  const indexed = pages.filter((p) => p.index);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexed.map((p) => `  <url><loc>${esc(site.url + p.path)}</loc><lastmod>${BUILD_DATE}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority.toFixed(1)}</priority></url>`).join('\n')}
</urlset>
`;
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap);
  await writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /account/\nDisallow: /certificate/\n\nSitemap: ${site.url}/sitemap.xml\n`);
  await writeFile(path.join(DIST, 'manifest.webmanifest'), JSON.stringify({
    name: site.fullName, short_name: site.name, start_url: '/', display: 'standalone', background_color: site.themeColor, theme_color: site.themeColor,
    description: site.description, icons: [{ src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  }, null, 2));
  // Security headers for Netlify-style hosts (vercel.json covers Vercel).
  const headers = `/*\n  Content-Security-Policy: ${CSP}; frame-ancestors 'none'\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Resource-Policy: same-origin\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`;
  await writeFile(path.join(DIST, '_headers'), headers);
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'), { recursive: true });
  await cp(path.join(ROOT, 'src/public'), DIST, { recursive: true });
  // cache-busting version from CSS + JS content
  const h = createHash('sha256');
  h.update(await readFile(path.join(ROOT, 'src/assets/css/main.css')));
  h.update(String(Date.now()));
  assetVersion = h.digest('hex').slice(0, 10);

  await buildHome();
  await buildCurriculum();
  await buildWeeks();
  await buildLabs();
  await buildPlaybook();
  await buildSoftware();
  await buildEffects();
  await buildEngine();
  await buildToolkit();
  await buildGlossary();
  await buildAppPages();
  await buildStatic();
  await buildSearchIndex();
  await buildMeta();
  console.log(`Built ${pages.length} pages (${pages.filter((p) => p.index).length} indexable) → dist/`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
