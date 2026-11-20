// Pure, DOM-free math for the second wave of labs and tools. Unit-tested.

// ---------------- Exposure ----------------
export const SHUTTERS = [1 / 25, 1 / 30, 1 / 48, 1 / 50, 1 / 60, 1 / 100, 1 / 120, 1 / 125, 1 / 250, 1 / 500, 1 / 1000, 1 / 2000];
export const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
export const ISOS = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
export const SCENES = [
  { id: 'sun', name: 'Bright sun', ev: 15 }, { id: 'overcast', name: 'Overcast day', ev: 12 }, { id: 'shade', name: 'Open shade', ev: 11 },
  { id: 'office', name: 'Bright office', ev: 8 }, { id: 'lamp', name: 'Living room lamp', ev: 6 }, { id: 'night', name: 'Night street', ev: 4 },
];
// EV100 of the camera settings, plus ND stops (an ND acts like more EV).
export function settingsEV({ aperture, shutter, iso, nd = 0 }) {
  if (!(aperture > 0) || !(shutter > 0) || !(iso > 0)) throw new Error('Invalid exposure settings');
  return Math.log2((aperture * aperture) / shutter) - Math.log2(iso / 100) + nd;
}
// Positive = overexposed by that many stops.
export function exposureOffset(sceneEV, settings) { return sceneEV - settingsEV(settings); }
export function shutterAngle(shutter, fps) { return 360 * fps * shutter; }
export function fmtShutter(s) { return s >= 1 ? `${s}s` : `1/${Math.round(1 / s)}`; }

// ---------------- White balance ----------------
// Tanner Helland's blackbody approximation (1000K–40000K) → [r,g,b] 0..255
export function kelvinToRgb(k) {
  const t = Math.max(1000, Math.min(40000, k)) / 100;
  let r, g, b;
  if (t <= 66) r = 255; else r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  if (t <= 66) g = 99.4708025861 * Math.log(t) - 161.1195681661; else g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (v) => Math.max(0, Math.min(255, v));
  return [c(r), c(g), c(b)];
}
// Channel gains an image gets when lit by `lightK` while the camera is set to `wbK`.
export function wbGains(lightK, wbK, tint = 0) {
  const L = kelvinToRgb(lightK), W = kelvinToRgb(wbK);
  const g = [L[0] / Math.max(1, W[0]), L[1] / Math.max(1, W[1]), L[2] / Math.max(1, W[2])].map((v) => v);
  const n = g[1] || 1;
  return [g[0] / n, (g[1] / n) * (1 - tint * 0.15), g[2] / n];
}
// Given the RGB of something that should be grey (seen with camera WB = wbK), estimate the light's Kelvin.
export function estimateKelvin(rgb, wbK) {
  const W = kelvinToRgb(wbK);
  const target = (rgb[0] * W[0]) / Math.max(1e-6, rgb[2] * Math.max(1, W[2]));
  let best = 6500, err = Infinity;
  for (let k = 1500; k <= 15000; k += 25) {
    const L = kelvinToRgb(k);
    const e = Math.abs(Math.log((L[0] / Math.max(1, L[2])) / target));
    if (e < err) { err = e; best = k; }
  }
  return best;
}

// ---------------- Lighting ----------------
export function keyFillRatio(key, fill) {
  if (!(fill > 0)) return Infinity;
  return (key + fill) / fill;
}
export function lookName(ratio) {
  if (ratio <= 2.2) return 'High-key (bright, commercial, comedy)';
  if (ratio <= 4.5) return 'Standard drama (natural modelling)';
  if (ratio <= 8.5) return 'Dramatic low-key (thriller)';
  return 'Noir (deep shadows)';
}

// ---------------- Compression (DCT) ----------------
const COS = (() => { const t = new Float64Array(64); for (let x = 0; x < 8; x++) for (let u = 0; u < 8; u++) t[x * 8 + u] = Math.cos(((2 * x + 1) * u * Math.PI) / 16); return t; })();
const C = (u) => (u === 0 ? Math.SQRT1_2 : 1);
export function dct8(block) { // block: Float64Array(64), values centred around 0
  const tmp = new Float64Array(64), out = new Float64Array(64);
  for (let y = 0; y < 8; y++) for (let u = 0; u < 8; u++) { let s = 0; for (let x = 0; x < 8; x++) s += block[y * 8 + x] * COS[x * 8 + u]; tmp[y * 8 + u] = 0.5 * C(u) * s; }
  for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) { let s = 0; for (let y = 0; y < 8; y++) s += tmp[y * 8 + u] * COS[y * 8 + v]; out[v * 8 + u] = 0.5 * C(v) * s; }
  return out;
}
export function idct8(coef) {
  const tmp = new Float64Array(64), out = new Float64Array(64);
  for (let v = 0; v < 8; v++) for (let x = 0; x < 8; x++) { let s = 0; for (let u = 0; u < 8; u++) s += C(u) * coef[v * 8 + u] * COS[x * 8 + u]; tmp[v * 8 + x] = 0.5 * s; }
  for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) { let s = 0; for (let v = 0; v < 8; v++) s += C(v) * tmp[v * 8 + x] * COS[y * 8 + v]; out[y * 8 + x] = 0.5 * s; }
  return out;
}
const LUMA_Q = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
const CHROMA_Q = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, ...Array(32).fill(99)];
export function quantMatrix(quality, chroma = false) {
  const q = Math.max(1, Math.min(100, Math.round(quality)));
  const scale = q < 50 ? 5000 / q : 200 - q * 2;
  return (chroma ? CHROMA_Q : LUMA_Q).map((v) => Math.max(1, Math.min(255, Math.floor((v * scale + 50) / 100))));
}
// Compress RGBA buffer like a JPEG/intra-frame codec. Returns new RGBA + stats.
export function compressImage(src, w, h, { quality = 50, subsampling = '420' } = {}) {
  const n = w * h;
  const Y = new Float64Array(n), Cb = new Float64Array(n), Cr = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const r = src[i * 4], g = src[i * 4 + 1], b = src[i * 4 + 2];
    Y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    Cb[i] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    Cr[i] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  }
  const sx = subsampling === '444' ? 1 : 2, sy = subsampling === '420' ? 2 : 1;
  if (sx > 1 || sy > 1) for (const ch of [Cb, Cr]) {
    for (let y = 0; y < h; y += sy) for (let x = 0; x < w; x += sx) {
      let s = 0, c = 0;
      for (let dy = 0; dy < sy && y + dy < h; dy++) for (let dx = 0; dx < sx && x + dx < w; dx++) { s += ch[(y + dy) * w + x + dx]; c++; }
      const avg = s / c;
      for (let dy = 0; dy < sy && y + dy < h; dy++) for (let dx = 0; dx < sx && x + dx < w; dx++) ch[(y + dy) * w + x + dx] = avg;
    }
  }
  let nonzero = 0, total = 0;
  const qY = quantMatrix(quality), qC = quantMatrix(quality, true);
  const blk = new Float64Array(64);
  for (const [ch, qm] of [[Y, qY], [Cb, qC], [Cr, qC]]) {
    for (let by = 0; by < h; by += 8) for (let bx = 0; bx < w; bx += 8) {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const px = Math.min(w - 1, bx + x), py = Math.min(h - 1, by + y); blk[y * 8 + x] = ch[py * w + px] - 128; }
      const co = dct8(blk);
      for (let k = 0; k < 64; k++) { const qv = Math.round(co[k] / qm[k]); if (qv !== 0) nonzero++; co[k] = qv * qm[k]; }
      total += 64;
      const rec = idct8(co);
      for (let y = 0; y < 8 && by + y < h; y++) for (let x = 0; x < 8 && bx + x < w; x++) ch[(by + y) * w + bx + x] = rec[y * 8 + x] + 128;
    }
  }
  const out = new Uint8ClampedArray(n * 4);
  let se = 0;
  for (let i = 0; i < n; i++) {
    const yy = Y[i], cb = Cb[i] - 128, cr = Cr[i] - 128;
    out[i * 4] = yy + 1.402 * cr; out[i * 4 + 1] = yy - 0.344136 * cb - 0.714136 * cr; out[i * 4 + 2] = yy + 1.772 * cb; out[i * 4 + 3] = 255;
    for (let c = 0; c < 3; c++) { const d = out[i * 4 + c] - src[i * 4 + c]; se += d * d; }
  }
  const mse = se / (n * 3);
  return { data: out, nonzero, total, ratio: nonzero / total, psnr: mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse) };
}

// ---------------- Trim tools ----------------
// clip = { id, in, out, len } — source frames [in, out), len = source length.
const dur = (c) => c.out - c.in;
const clone = (clips) => clips.map((c) => ({ ...c }));
const clampD = (d, lo, hi) => Math.max(lo, Math.min(hi, d)) || 0; // "|| 0" normalises -0
export function seqLength(clips) { return clips.reduce((a, c) => a + dur(c), 0); }
export function ripple(clips, i, edge, d) {
  const out = clone(clips), c = out[i];
  if (!c) return { clips: out, applied: 0 };
  let a;
  if (edge === 'end') { a = clampD(d, 1 - dur(c), c.len - c.out); c.out += a; } else { a = clampD(d, -c.in, dur(c) - 1); c.in += a; }
  return { clips: out, applied: a };
}
export function roll(clips, i, d) { // edit point between i and i+1
  const out = clone(clips), a = out[i], b = out[i + 1];
  if (!a || !b) return { clips: out, applied: 0 };
  const lo = Math.max(1 - dur(a), -b.in), hi = Math.min(a.len - a.out, dur(b) - 1);
  const x = clampD(d, lo, hi); a.out += x; b.in += x;
  return { clips: out, applied: x };
}
export function slip(clips, i, d) {
  const out = clone(clips), c = out[i];
  if (!c) return { clips: out, applied: 0 };
  const x = clampD(d, -c.in, c.len - c.out); c.in += x; c.out += x;
  return { clips: out, applied: x };
}
export function slide(clips, i, d) { // move clip i; neighbours absorb the change
  const out = clone(clips), p = out[i - 1], n = out[i + 1];
  if (!p || !n) return { clips: out, applied: 0 };
  const lo = Math.max(1 - dur(p), -n.in), hi = Math.min(p.len - p.out, dur(n) - 1);
  const x = clampD(d, lo, hi); p.out += x; n.in += x;
  return { clips: out, applied: x };
}
export function timelineStart(clips, i) { let s = 0; for (let k = 0; k < i; k++) s += dur(clips[k]); return s; }

// ---------------- Loudness (ITU-R BS.1770-4 / EBU R128) ----------------
// K-weighting filter coefficients for any sample rate (libebur128 bilinear design; matches ITU-R BS.1770 at 48 kHz).
export function kCoeffs(fs) {
  let K = Math.tan((Math.PI * 1681.974450955533) / fs);
  const Q1 = 0.7071752369554196, Vh = Math.pow(10, 3.999843853973347 / 20), Vb = Math.pow(Vh, 0.4996667741545416);
  let a0 = 1 + K / Q1 + K * K;
  const s1 = [(Vh + (Vb * K) / Q1 + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q1 + K * K) / a0, (2 * (K * K - 1)) / a0, (1 - K / Q1 + K * K) / a0];
  K = Math.tan((Math.PI * 38.13547087602444) / fs);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  const s2 = [1, -2, 1, (2 * (K * K - 1)) / a0, (1 - K / Q2 + K * K) / a0];
  return [s1, s2];
}
export function kWeight(x, fs) {
  let inp = x;
  for (const [b0, b1, b2, a1, a2] of kCoeffs(fs)) {
    const out = new Float32Array(inp.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < inp.length; i++) { const xi = inp[i]; const y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = y; out[i] = y; }
    inp = out;
  }
  return inp;
}
export function measureLoudness(channels, fs) {
  if (!channels.length || !(fs > 0)) throw new Error('No audio');
  const len = channels[0].length;
  const block = Math.round(0.4 * fs), step = Math.round(0.1 * fs);
  let peak = 0;
  for (const ch of channels) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; }
  const samplePeakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  if (len < block) return { integrated: -Infinity, momentaryMax: -Infinity, samplePeakDb, duration: len / fs };
  const weights = channels.map((_, i) => (channels.length > 3 && i >= 3 ? 1.41 : 1));
  const kw = channels.map((c) => kWeight(c, fs));
  const zs = []; // per block: per-channel mean square
  for (let s = 0; s + block <= len; s += step) {
    const z = kw.map((c) => { let acc = 0; for (let i = s; i < s + block; i++) acc += c[i] * c[i]; return acc / block; });
    zs.push(z);
  }
  const lk = (z) => -0.691 + 10 * Math.log10(z.reduce((a, v, i) => a + weights[i] * v, 0) || 1e-20);
  const loud = zs.map(lk);
  const abs = zs.filter((_, i) => loud[i] > -70);
  if (!abs.length) return { integrated: -Infinity, momentaryMax: loud.reduce((a, b) => Math.max(a, b), -Infinity), samplePeakDb, duration: len / fs, series: loud };
  const mean = (arr) => channels.map((_, c) => arr.reduce((a, z) => a + z[c], 0) / arr.length);
  const rel = lk(mean(abs)) - 10;
  const gated = zs.filter((_, i) => loud[i] > -70 && loud[i] > rel);
  return { integrated: lk(mean(gated)), momentaryMax: loud.reduce((a, b) => Math.max(a, b), -Infinity), samplePeakDb, duration: len / fs, series: loud };
}
export const LOUDNESS_TARGETS = [
  { id: 'youtube', name: 'YouTube / Spotify / social', lufs: -14, tp: -1 },
  { id: 'podcast', name: 'Podcast (Apple)', lufs: -16, tp: -1 },
  { id: 'ebu', name: 'Broadcast EU (EBU R128)', lufs: -23, tp: -1 },
  { id: 'atsc', name: 'Broadcast US (ATSC A/85)', lufs: -24, tp: -2 },
  { id: 'netflix', name: 'Streaming drama (approx. −27 dialog)', lufs: -27, tp: -2 },
];
export function gainAdvice(m, target) {
  if (!Number.isFinite(m.integrated)) return { gain: null, peakAfter: null, needsLimiter: false };
  const gain = target.lufs - m.integrated;
  const peakAfter = m.samplePeakDb + gain;
  return { gain, peakAfter, needsLimiter: peakAfter > target.tp };
}

// ---------------- Export settings ----------------
export const PLATFORMS = {
  youtube: { name: 'YouTube (long-form)', container: 'MP4', vcodec: 'H.264 High (or ProRes for best quality upload)', w: 3840, h: 2160, mbps: 50, audio: 'AAC-LC 320 kbps, 48 kHz stereo', lufs: -14, tp: -1, notes: ['Upload 4K even from a 1080p edit. YouTube gives 4K uploads a higher-quality encode.', 'Keep the source frame rate. Do not convert 24 to 30.', 'Tag Rec.709 (1-1-1) for SDR.'] },
  shorts: { name: 'YouTube Shorts / Reels / TikTok', container: 'MP4', vcodec: 'H.264 High', w: 1080, h: 1920, mbps: 20, audio: 'AAC-LC 256 kbps, 48 kHz', lufs: -14, tp: -1, notes: ['Vertical 9:16, 1080×1920.', 'Keep text inside the safe zones (see the Aspect Ratio lab).', '30 fps is the safest; 24/25/60 also work.'] },
  feed: { name: 'Instagram / LinkedIn feed (4:5)', container: 'MP4', vcodec: 'H.264 High', w: 1080, h: 1350, mbps: 15, audio: 'AAC-LC 256 kbps, 48 kHz', lufs: -14, tp: -1, notes: ['4:5 takes more screen space in feeds than 16:9.', 'Burn in captions. Most feed viewing is muted.'] },
  vimeo: { name: 'Vimeo / portfolio', container: 'MP4', vcodec: 'H.264 High', w: 1920, h: 1080, mbps: 30, audio: 'AAC-LC 320 kbps, 48 kHz', lufs: -14, tp: -1, notes: ['Vimeo re-encodes less aggressively than social apps, so it is good for reels.'] },
  review: { name: 'Client review copy', container: 'MP4', vcodec: 'H.264 High', w: 1920, h: 1080, mbps: 10, audio: 'AAC-LC 192 kbps, 48 kHz', lufs: -14, tp: -1, notes: ['Burn in timecode and a "DRAFT" watermark.', 'Small file, fast upload to Frame.io or similar.'] },
  master: { name: 'Mezzanine master / archive', container: 'MOV', vcodec: 'Apple ProRes 422 HQ (10-bit)', w: 0, h: 0, mbps: 0, audio: 'PCM 24-bit 48 kHz (plus separate stems)', lufs: null, tp: -1, notes: ['Full resolution, source frame rate.', 'Keep D/M/E stems and a textless version.'] },
  broadcast: { name: 'Broadcast (EBU R128 style)', container: 'MOV / MXF per spec', vcodec: 'ProRes 422 HQ or XDCAM HD422 per network spec', w: 1920, h: 1080, mbps: 0, audio: 'PCM 24-bit 48 kHz', lufs: -23, tp: -1, notes: ['Always follow the network delivery spec sheet. It overrides everything here.', 'Legal video levels, start timecode 10:00:00:00, bars, tone and slate if requested.'] },
  podcast: { name: 'Podcast audio only', container: 'MP3', vcodec: '— (audio only)', w: 0, h: 0, mbps: 0, audio: 'MP3 192 kbps or AAC 160 kbps, 44.1/48 kHz', lufs: -16, tp: -1, notes: ['Mono is fine for speech-only shows and halves the file size.'] },
};
export function exportSpec(id, { fps = 25, srcW = 1920, srcH = 1080 } = {}) {
  const p = PLATFORMS[id];
  if (!p) throw new Error('Unknown platform');
  const w = p.w || srcW, h = p.h || srcH;
  return { ...p, id, w, h, fps };
}
const safeName = (s) => String(s).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) || 'input.mov';
export function ffmpegCommand(spec, input = 'input.mov') {
  const inp = safeName(input);
  const base = inp.replace(/\.[^.]+$/, '');
  const fps = Number(spec.fps) || 25;
  const ln = spec.lufs != null ? ` -af loudnorm=I=${spec.lufs}:TP=${spec.tp}:LRA=11` : '';
  if (spec.id === 'podcast') return `ffmpeg -i ${inp} -vn -c:a libmp3lame -b:a 192k -ar 48000${ln} ${base}_podcast.mp3`;
  if (spec.id === 'master' || spec.id === 'broadcast') {
    return `ffmpeg -i ${inp} -c:v prores_ks -profile:v 3 -vendor apl0 -pix_fmt yuv422p10le -vf "scale=${spec.w}:${spec.h}:flags=lanczos" -r ${fps} -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a pcm_s24le -ar 48000${ln} ${base}_${spec.id}.mov`;
  }
  const kb = Math.round(spec.mbps * 1000);
  const ab = spec.id === 'review' ? '192k' : spec.id === 'youtube' || spec.id === 'vimeo' ? '320k' : '256k';
  return `ffmpeg -i ${inp} -c:v libx264 -preset slow -crf 18 -maxrate ${kb}k -bufsize ${kb * 2}k -pix_fmt yuv420p -vf "scale=${spec.w}:${spec.h}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${spec.w}:${spec.h}:(ow-iw)/2:(oh-ih)/2" -r ${fps} -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a ${ab} -ar 48000${ln} -movflags +faststart ${base}_${spec.id}.mp4`;
}

// ---------------- Captions / SRT ----------------
export function srtTime(sec, sep = ',') {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(r).padStart(3, '0')}`;
}
export function buildCaptions(text, { duration, start = 0, maxChars = 42, maxLines = 2, maxCps = 17, minDur = 1 } = {}) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return [];
  if (!(duration > 0)) throw new Error('Duration must be positive');
  maxChars = Math.max(10, Math.min(80, maxChars)); maxLines = Math.max(1, Math.min(3, maxLines));
  const caps = [];
  let lines = [], line = '';
  const flush = () => { if (line) lines.push(line); line = ''; if (lines.length) caps.push({ lines }); lines = []; };
  for (const w of words) {
    const word = w.length > maxChars ? w.slice(0, maxChars) : w;
    if ((line + ' ' + word).trim().length > maxChars) { lines.push(line); line = word; if (lines.length >= maxLines) { caps.push({ lines }); lines = []; } }
    else line = (line + ' ' + word).trim();
    if (/[.!?]["')\]]?$/.test(word) && (lines.length || line.length > maxChars * 0.5)) flush();
  }
  flush();
  const chars = caps.map((c) => c.lines.join(' ').length);
  const totalChars = chars.reduce((a, b) => a + b, 0);
  let t = start;
  return caps.map((c, i) => {
    const d = (chars[i] / totalChars) * duration;
    const cap = { index: i + 1, start: t, end: t + d, lines: c.lines };
    cap.cps = chars[i] / Math.max(0.001, d);
    cap.warn = cap.cps > maxCps ? `Too fast: ${cap.cps.toFixed(1)} characters/sec (max ${maxCps})` : d < minDur ? `Shorter than ${minDur}s` : null;
    t += d;
    return cap;
  });
}
export function toSRT(caps) { return caps.map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.lines.join('\n')}\n`).join('\n'); }
export function toVTT(caps) { return 'WEBVTT\n\n' + caps.map((c) => `${srtTime(c.start, '.')} --> ${srtTime(c.end, '.')}\n${c.lines.join('\n')}\n`).join('\n'); }
export function parseSRT(str) {
  const blocks = String(str ?? '').replace(/\r/g, '').trim().split(/\n\s*\n/);
  const caps = [], errors = [];
  const toSec = (t) => { const m = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{3})$/.exec(t.trim()); if (!m) return null; return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000; };
  blocks.forEach((b, bi) => {
    if (!b.trim()) return;
    const ls = b.split('\n');
    const ti = /-->/.test(ls[0]) ? 0 : 1;
    const parts = (ls[ti] || '').split('-->');
    const s = toSec(parts[0] || ''), e = toSec(parts[1] || '');
    if (s == null || e == null) { errors.push(`Block ${bi + 1}: bad timing line`); return; }
    if (e <= s) errors.push(`Block ${bi + 1}: ends before it starts`);
    const lines = ls.slice(ti + 1).filter((l) => l.trim());
    caps.push({ index: caps.length + 1, start: s, end: e, lines, cps: lines.join(' ').length / Math.max(0.001, e - s) });
  });
  for (let i = 1; i < caps.length; i++) if (caps[i].start < caps[i - 1].end - 0.0005) errors.push(`Caption ${i + 1} overlaps caption ${i}`);
  return { caps, errors };
}

// ---------------- Freelance rates ----------------
export function rateCalc({ income, expenses = 0, weeksOff = 6, daysPerWeek = 5, utilization = 0.6, taxRate = 0.25 }) {
  if (!(income >= 0) || !(expenses >= 0)) throw new Error('Invalid amounts');
  const weeks = Math.max(1, 52 - Math.max(0, Math.min(51, weeksOff)));
  const billable = weeks * Math.max(1, Math.min(7, daysPerWeek)) * Math.max(0.05, Math.min(1, utilization));
  const gross = (income / Math.max(0.01, 1 - Math.max(0, Math.min(0.9, taxRate)))) + expenses;
  const day = gross / billable;
  return { billableDays: billable, grossNeeded: gross, dayRate: day, hourRate: day / 8 };
}
// Rough editing-hours per FINISHED minute, by project type (industry rules of thumb; adjust to your speed).
export const PROJECT_TYPES = {
  social: { name: 'Social short (15–60s)', hpm: 4 },
  youtube: { name: 'YouTube long-form', hpm: 1.2 },
  corporate: { name: 'Corporate / explainer', hpm: 7 },
  wedding: { name: 'Wedding highlight film', hpm: 6 },
  music: { name: 'Music video', hpm: 9 },
  commercial: { name: 'Commercial (15–60s)', hpm: 30 },
  documentary: { name: 'Documentary', hpm: 10 },
};
export function projectQuote({ type, minutes, dayRate, revisions = 2, color = false, sound = false }) {
  const t = PROJECT_TYPES[type];
  if (!t || !(minutes > 0) || !(dayRate > 0)) throw new Error('Invalid quote input');
  let hours = t.hpm * minutes;
  if (color) hours *= 1.2;
  if (sound) hours *= 1.15;
  hours *= 1 + 0.1 * Math.max(0, revisions - 2);
  hours = Math.max(2, hours);
  return { hours, days: hours / 8, price: (hours / 8) * dayRate };
}

// ---------------- CSV (formula-injection safe) ----------------
export function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formulas
  return /[",\n\r]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCSV(rows) { return rows.map((r) => r.map(csvCell).join(',')).join('\r\n'); }

// ---------------- AI shot prompt builder ----------------
export const PROMPT_OPTIONS = {
  size: ['', 'Extreme wide shot', 'Wide shot', 'Medium wide shot', 'Medium shot', 'Medium close-up', 'Close-up', 'Extreme close-up', 'Insert shot', 'Over-the-shoulder shot', 'POV shot', 'Aerial shot'],
  angle: ['', 'eye-level', 'low-angle', 'high-angle', 'Dutch-angle', 'overhead top-down'],
  lens: ['', '14mm ultra-wide, deep focus', '24mm wide', '35mm natural perspective', '50mm normal lens', '85mm portrait lens, shallow depth of field', '135mm telephoto, compressed background', '100mm macro'],
  move: ['', 'static locked-off camera', 'slow dolly in', 'slow dolly out', 'smooth tracking shot alongside the subject', 'handheld, subtle shake', 'gimbal follow from behind', 'slow orbit around the subject', 'crane up revealing the location', 'FPV drone fly-through', 'slow pan left to right', 'rack focus from foreground to subject'],
  light: ['', 'soft window light from camera left', 'hard sunlight, crisp shadows', 'golden hour backlight with rim light', 'overcast soft daylight', 'single practical lamp, low-key, 8:1 contrast', 'neon signs, mixed color light', 'moonlight blue ambience', 'high-key studio lighting, 2:1 contrast', 'Rembrandt lighting, 4:1 contrast'],
  palette: ['', 'teal and orange grade', 'muted desaturated palette', 'warm nostalgic palette, faded blacks', 'cool blue night palette', 'vibrant saturated colors', 'black and white, high contrast', 'pastel palette'],
  texture: ['', 'shot on 35mm film, fine grain, soft halation', '16mm film, visible grain', 'clean digital cinema camera look', 'VHS camcorder look', 'anamorphic lens flares, oval bokeh'],
  aspect: ['16:9', '2.39:1', '9:16', '1:1', '4:5'],
};
const clip = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const pick = (key, v) => (PROMPT_OPTIONS[key].includes(v) ? v : '');
export function buildShotPrompt(o = {}) {
  const size = pick('size', o.size), angle = pick('angle', o.angle), lens = pick('lens', o.lens), move = pick('move', o.move);
  const light = pick('light', o.light), palette = pick('palette', o.palette), texture = pick('texture', o.texture);
  const aspect = pick('aspect', o.aspect) || '16:9';
  const subject = clip(o.subject, 160), action = clip(o.action, 160), setting = clip(o.setting, 160), mood = clip(o.mood, 80);
  const dur = Math.max(2, Math.min(20, Math.round(Number(o.duration) || 5)));
  const head = [angle && size ? `${angle.charAt(0).toUpperCase() + angle.slice(1)} ${size.toLowerCase()}` : size || (angle ? `${angle.charAt(0).toUpperCase() + angle.slice(1)} shot` : ''), subject ? `of ${subject}` : '', action].filter(Boolean).join(' ');
  const sentences = [
    [head, setting].filter(Boolean).join(', '),
    lens && lens.charAt(0).toUpperCase() + lens.slice(1),
    move && move.charAt(0).toUpperCase() + move.slice(1),
    light && light.charAt(0).toUpperCase() + light.slice(1),
    palette && palette.charAt(0).toUpperCase() + palette.slice(1),
    texture && texture.charAt(0).toUpperCase() + texture.slice(1),
    mood && `Mood: ${mood}`,
    `${dur} seconds, ${aspect}, one continuous shot, no cuts`,
  ].filter(Boolean).map((x) => x.replace(/\.$/, '') + '.');
  const negative = ['text', 'subtitles', 'logos', 'watermark', 'extra fingers', 'distorted faces', 'morphing', 'flicker'].concat(o.avoid ? clip(o.avoid, 160).split(',').map((x) => x.trim()).filter(Boolean) : []).slice(0, 16);
  const missing = [];
  if (!size) missing.push('shot size'); if (!subject) missing.push('subject'); if (!lens) missing.push('lens'); if (!move) missing.push('camera movement'); if (!light) missing.push('lighting'); if (!palette) missing.push('color palette');
  const score = 6 - missing.length + (angle ? 1 : 0) + (texture ? 1 : 0) + (setting ? 1 : 0) + (action ? 1 : 0);
  return { prompt: sentences.join(' '), negative: negative.join(', '), missing, score, max: 10 };
}
