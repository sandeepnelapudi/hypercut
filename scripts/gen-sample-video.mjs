#!/usr/bin/env node
// Renders the sample lesson video (Week 1, Lesson 1) frame by frame with headless Chromium,
// then encodes H.264 MP4 + poster with FFmpeg. Output is committed to src/public/media/.
// Usage: node scripts/gen-sample-video.mjs   (needs Playwright + ffmpeg on PATH)
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/public/media');
const NAME = 'w01-l1-frames-shutter';
const FPS = 24, DUR = 40, W = 1280, H = 720;

const page = `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="${W}" height="${H}"></canvas><script>
const c = document.getElementById('c').getContext('2d');
const W = ${W}, H = ${H};
const grad = () => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#ff3d7f'); g.addColorStop(.5, '#a55cff'); g.addColorStop(1, '#00e0ff'); return g; };
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
function text(s, x, y, size, color = '#ececf4', weight = 800, align = 'center') { c.font = weight + ' ' + size + 'px system-ui, sans-serif'; c.fillStyle = color; c.textAlign = align; c.fillText(s, x, y); }
function ball(x, y, r, a = 1) { c.globalAlpha = a; c.fillStyle = '#ff3d7f'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
function lane(y, label, sub) { c.fillStyle = '#161624'; c.fillRect(60, y - 55, 1160, 110); text(label, 84, y - 8, 30, '#ececf4', 800, 'left'); text(sub, 84, y + 26, 18, '#a3a3bd', 500, 'left'); }
function brand(a) { c.globalAlpha = a; text('HYPERCUT', W - 40, H - 30, 22, grad(), 900, 'right'); c.globalAlpha = 1; }
window.draw = function (t) {
  c.fillStyle = '#0b0b12'; c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(200, 0, 0, 200, 0, 700); glow.addColorStop(0, 'rgba(255,61,127,.18)'); glow.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = glow; c.fillRect(0, 0, W, H);
  let fade = 1;
  const scene = t < 8 ? 0 : t < 20 ? 1 : t < 32 ? 2 : 3;
  const start = [0, 8, 20, 32][scene], end = [8, 20, 32, 40][scene];
  fade = Math.min(ease((t - start) / 0.5), ease((end - t) / 0.5));
  if (scene === 3) fade = ease((t - start) / 0.5);
  c.globalAlpha = 1;
  if (scene === 0) {
    text('Video is a stack of still frames', W / 2, 140, 54);
    const off = (t * 120) % 200;
    for (let i = -1; i < 8; i++) {
      const x = 60 + i * 200 - off;
      c.fillStyle = '#1d1d2e'; c.fillRect(x, 240, 180, 230);
      c.fillStyle = '#0b0b12'; for (let k = 0; k < 6; k++) { c.fillRect(x + 8 + k * 29, 248, 16, 12); c.fillRect(x + 8 + k * 29, 450, 16, 12); }
      c.fillStyle = '#2a2a40'; c.fillRect(x + 12, 270, 156, 170);
      const n = i + Math.floor(t * 120 / 200);
      ball(x + 30 + ((n * 23) % 120), 355, 18);
      text('F' + ((n % 99) + 1), x + 90, 435, 16, '#a3a3bd', 600);
    }
    text('Played fast enough, your brain fuses them into motion.', W / 2, 580, 30, '#a3a3bd', 500);
  } else if (scene === 1) {
    text('Frame rate = how many frames per second', W / 2, 110, 46);
    const lt = t - 8;
    [[12, 'choppy, stop-motion'], [24, 'cinematic'], [60, 'smooth, hyper-real']].forEach(([fps, sub], i) => {
      const y = 230 + i * 150; lane(y, fps + ' fps', sub);
      const q = Math.floor(lt * fps) / fps; const p = (q * 0.45) % 2; const pos = p < 1 ? p : 2 - p;
      ball(400 + pos * 780, y, 32);
    });
  } else if (scene === 2) {
    text('Shutter angle = how long each frame is exposed', W / 2, 110, 44);
    const lt = t - 20;
    [[45, '1/192 s', 'crisp, staccato'], [180, '1/48 s', 'natural motion blur'], [360, '1/24 s', 'smeared, dreamy']].forEach(([ang, sh, sub], i) => {
      const y = 230 + i * 150; lane(y, ang + '°', sh + ' · ' + sub);
      const q = Math.floor(lt * 24) / 24; const exp = (ang / 360) / 24; const n = 24;
      for (let s = 0; s < n; s++) { const tt = q + exp * s / n; const p = (tt * 0.9) % 2; const pos = p < 1 ? p : 2 - p; ball(400 + pos * 780, y, 32, 1.4 / n); }
    });
  } else {
    text('The 180° shutter rule', W / 2, 150, 60, grad(), 900);
    text('Shutter speed = 1 ÷ (2 × frame rate)', W / 2, 250, 44);
    const rows = [['24 fps', '1/48 (or 1/50)'], ['25 fps', '1/50'], ['30 fps', '1/60'], ['60 fps', '1/120']];
    rows.forEach(([a, b], i) => { const y = 350 + i * 62; c.globalAlpha = ease((t - 33 - i * 0.6) / 0.5); text(a, W / 2 - 30, y, 34, '#a3a3bd', 600, 'right'); text('→  ' + b, W / 2 + 10, y, 34, '#ececf4', 800, 'left'); c.globalAlpha = 1; });
    text('Try it yourself in the Shutter & FPS lab', W / 2, 650, 26, '#00e0ff', 600);
  }
  // fade overlay
  if (fade < 1) { c.globalAlpha = 1 - fade; c.fillStyle = '#0b0b12'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  brand(0.9);
};
</script></body></html>`;

const vtt = `WEBVTT

00:00:00.500 --> 00:00:04.000
Video is a stack of still photographs called frames.

00:00:04.000 --> 00:00:07.800
Played fast enough, your brain fuses them into motion.

00:00:08.500 --> 00:00:13.500
Frame rate is how many frames you show each second.

00:00:13.500 --> 00:00:19.500
12 fps feels choppy, 24 fps feels cinematic, 60 fps feels smooth and hyper-real.

00:00:20.500 --> 00:00:25.500
Shutter angle is how long each frame is exposed.

00:00:25.500 --> 00:00:31.500
45° is crisp and staccato, 180° gives natural motion blur, 360° looks smeared.

00:00:32.500 --> 00:00:36.000
The 180° rule: shutter speed equals one over twice the frame rate.

00:00:36.000 --> 00:00:40.000
At 24 fps, shoot at 1/48 or 1/50 of a second.
`;

const tmp = await mkdtemp(path.join(os.tmpdir(), 'hc-frames-'));
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await p.setContent(page);
for (let i = 0; i < FPS * DUR; i++) {
  const data = await p.evaluate((t) => { window.draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, i / FPS);
  await writeFile(path.join(tmp, `${String(i).padStart(5, '0')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
}
await browser.close();
await mkdir(OUT, { recursive: true });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', path.join(OUT, `${NAME}.mp4`)]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(OUT, `${NAME}.mp4`), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', path.join(OUT, `${NAME}.webm`)]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, '00600.jpg'), '-vf', 'scale=1280:720', '-q:v', '4', path.join(OUT, `${NAME}.jpg`)]);
await writeFile(path.join(OUT, `${NAME}.en.vtt`), vtt);
await rm(tmp, { recursive: true, force: true });
console.log('Sample video written to', OUT);
