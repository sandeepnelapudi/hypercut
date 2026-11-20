#!/usr/bin/env node
// Renders the PNG icons and the Open Graph share image with headless Chromium.
// Output is committed to src/assets/img so builds need no browser.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/assets/img');
await mkdir(OUT, { recursive: true });
const grad = 'linear-gradient(135deg,#ff3d7f,#a55cff 50%,#00e0ff)';
const icon = (s) => `<html><body style="margin:0;background:transparent"><div style="width:${s}px;height:${s}px;border-radius:${s * 0.22}px;background:${grad};display:grid;place-items:center"><svg width="${s * 0.55}" height="${s * 0.55}" viewBox="0 0 64 64"><path d="M20 10 L52 32 L20 54 Z" fill="#fff"/><rect x="6" y="10" width="6" height="44" rx="3" fill="#fff" opacity=".85"/></svg></div></body></html>`;
const og = `<html><body style="margin:0"><div style="width:1200px;height:630px;background:#0b0b12;position:relative;overflow:hidden;font-family:system-ui,sans-serif;color:#fff">
<div style="position:absolute;inset:0;background:radial-gradient(600px 300px at 15% 10%,rgba(255,61,127,.35),transparent 60%),radial-gradient(600px 300px at 90% 30%,rgba(0,224,255,.3),transparent 60%)"></div>
<div style="position:absolute;left:80px;top:90px"><div style="font-weight:900;letter-spacing:.06em;font-size:42px">HYPER<span style="background:${grad};-webkit-background-clip:text;color:transparent">CUT</span></div>
<div style="font-size:96px;font-weight:900;line-height:1;margin-top:40px;letter-spacing:-.03em">Edit <span style="background:${grad};-webkit-background-clip:text;color:transparent">God Mode</span><br>in 90 days.</div>
<div style="font-size:30px;color:#a3a3bd;margin-top:30px">Cinematography · Color · Sound · VFX · Trends · AI · Pro workflow</div></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:56px;background:#12121c;display:flex;gap:4px;padding:12px">${['#ff3d7f', '#a55cff', '#00e0ff', '#3ddc97', '#ffd23f', '#5c7cff', '#ff3d7f', '#a55cff', '#00e0ff', '#3ddc97', '#ffd23f', '#5c7cff'].map((c, i) => `<span style="flex:${1 + (i % 3)};background:${c};border-radius:4px;opacity:.85"></span>`).join('')}</div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const s of [192, 512]) {
  await page.setViewportSize({ width: s, height: s });
  await page.setContent(icon(s));
  await page.locator('div').first().screenshot({ path: path.join(OUT, `icon-${s}.png`), omitBackground: true });
}
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(og);
await page.screenshot({ path: path.join(OUT, 'og.png') });
await browser.close();
console.log('Images written to', OUT);
