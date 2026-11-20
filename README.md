# HYPERCUT: Edit God Mode

A 90-day video editing course website, from first cut to pro.

- **12 weeks, 60 lessons, 62 quiz questions.** Topics in order: how video and editing engines work, NLE mastery, cinematography, editing theory, sound, color theory and science, color grading, motion graphics, VFX, trending effects, genre mastery, AI tools, delivery and the business of editing.
- **25 interactive labs, lessons and tools:**
  - *Labs:* Color Grading Studio (live waveform, parade, vectorscope, histogram), Color Harmony, Shutter & FPS, Lens & Depth of Field, Composition Grids, Aspect Ratio & Safe Zones, Bitrate & Storage, Timecode (with drop-frame), Easing Curves, Beat Sync, EQ Ear Trainer, Chroma Key, Blend Modes and Shortcut Trainer.
  - *Interactive lessons with auto-checked missions:* Exposure Triangle, White Balance, Three-Point Lighting, Inside the Codec (DCT compression), Trim Tools (ripple, roll, slip, slide) and the Kuleshov Experiment.
  - *Pro tools:* LUFS Loudness Meter (ITU-R BS.1770-4), Export Settings Generator with FFmpeg commands, Caption & SRT Maker, Freelance Rate & Quote Calculator and Shot List Builder.
- **Editor's Toolkit** (`/toolkit/`): 32 essential utilities, plugins, assets and pieces of hardware, with a kit builder by budget and focus and an "I have this" checklist.
- **Scenario Playbook:** 31 real-world problems, each with a diagnosis, a fix and the location of the tools in Premiere Pro, DaVinci Resolve, Final Cut Pro and CapCut.
- **Also included:** an Effects Cookbook (21 recipes), Software Compared (12 apps), *Inside the Engine* (13 chapters), a glossary, spaced-repetition flashcards, a 90-day planner, XP, levels, streaks, badges, notes, bookmarks, a dashboard and a certificate.

## Run it

```bash
npm run build      # generates dist/ (117 pre-rendered pages)
npm run serve      # http://localhost:4173
```

No dependencies are needed (Node 20 or later). Set `SITE_URL=https://your-domain.com` when building so canonical URLs, the sitemap and Open Graph tags point to your domain.

## Test

```bash
npm test           # 51 unit tests: lab math, loudness, auth/security, progress, content, SEO, links
npm run test:e2e   # 21 browser tests (Playwright): every page, flows, missions, tools, XSS, mobile, a11y
```

## Deploy

The site is fully static. Deploy `dist/` anywhere:

- **Vercel:** `vercel.json` is included (build command, output directory, security headers).
- **Netlify / Cloudflare Pages:** `dist/_headers` is generated.

## Connecting a real database later

All data access goes through one adapter in `src/assets/js/core/db.js`, which has four async methods: `get`, `put`, `delete` and `keys`. To move to a backend:

1. Write a `RestAdapter` (or Supabase/Firebase/etc.) with the same 4 methods and call `setDB(new RestAdapter())`.
2. **Move authentication to the server.** `core/auth.js` hashes passwords with PBKDF2-SHA256 (600k iterations), stores only token hashes, rate-limits logins, avoids user enumeration and revokes sessions. However, in a browser-only app all of this runs on the user's device. It protects passwords at rest and separates accounts on a shared browser, but it is **not** server-side security, and accounts do not sync across devices. With a backend, do hashing and sessions on the server and use httpOnly, Secure, SameSite cookies.
3. Progress documents (`progress` collection, one per user) are already sanitised on read, so the schema can move as-is.

## Security measures in place

- Strict Content Security Policy (no inline scripts or styles, `frame-ancestors 'none'`), HSTS, nosniff, and Referrer-Policy and Permissions-Policy headers
- All user content is rendered with `textContent`/DOM APIs. `innerHTML` is never used with user data, and this is tested with XSS payloads.
- Open-redirect protection on `?next=`, path-traversal protection in the dev server, and protection against prototype pollution and corrupt data in storage
- Image uploads in labs are type- and size-checked, decoded locally and never uploaded

## SEO

Each page is pre-rendered HTML with a unique title and description, a canonical URL, Open Graph and Twitter tags, and JSON-LD. The schema types used are Course (with syllabus), FAQPage, WebSite with SearchAction, BreadcrumbList, LearningResource, HowTo, WebApplication, TechArticle and DefinedTermSet. The build also generates `sitemap.xml`, `robots.txt` and a web manifest. Private pages are marked `noindex`. After deploying, submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Project layout

```
src/content/        course content (weeks, scenarios, software, effects, glossary, engine)
src/assets/js/core/ db adapter, auth, progress, UI helpers
src/assets/js/labs/ the 14 labs + lib.js (pure, unit-tested math)
scripts/build.mjs   static site generator
tests/              unit + e2e
```
