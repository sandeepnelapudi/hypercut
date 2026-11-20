// Pure, DOM-free math used by the labs. Unit-tested in tests/unit.

// ---------------- Timecode ----------------
export const FPS_OPTIONS = [
  { id: '23.976', label: '23.976 (NDF)', fps: 24000 / 1001, nominal: 24, df: false },
  { id: '24', label: '24', fps: 24, nominal: 24, df: false },
  { id: '25', label: '25 (PAL)', fps: 25, nominal: 25, df: false },
  { id: '29.97df', label: '29.97 Drop-Frame', fps: 30000 / 1001, nominal: 30, df: true },
  { id: '29.97', label: '29.97 Non-Drop', fps: 30000 / 1001, nominal: 30, df: false },
  { id: '30', label: '30', fps: 30, nominal: 30, df: false },
  { id: '50', label: '50', fps: 50, nominal: 50, df: false },
  { id: '59.94df', label: '59.94 Drop-Frame', fps: 60000 / 1001, nominal: 60, df: true },
  { id: '59.94', label: '59.94 Non-Drop', fps: 60000 / 1001, nominal: 60, df: false },
  { id: '60', label: '60', fps: 60, nominal: 60, df: false },
];
export function fpsById(id) { return FPS_OPTIONS.find((f) => f.id === id) || FPS_OPTIONS[1]; }

const pad = (n, w = 2) => String(n).padStart(w, '0');

export function framesToTC(frames, rate) {
  if (!Number.isFinite(frames)) throw new Error('Invalid frame count');
  const neg = frames < 0;
  let f = Math.abs(Math.trunc(frames));
  const nom = rate.nominal;
  if (rate.df) {
    const drop = nom === 60 ? 4 : 2;
    const framesPer10 = Math.round(rate.fps * 600); // 17982 @29.97, 35964 @59.94
    const framesPerMin = nom * 60 - drop;
    const d = Math.floor(f / framesPer10);
    const m = f % framesPer10;
    f += drop * 9 * d + (m > drop ? drop * Math.floor((m - drop) / framesPerMin) : 0);
  }
  const ff = f % nom;
  const ss = Math.floor(f / nom) % 60;
  const mm = Math.floor(f / (nom * 60)) % 60;
  const hh = Math.floor(f / (nom * 3600));
  return `${neg ? '-' : ''}${pad(hh)}:${pad(mm)}:${pad(ss)}${rate.df ? ';' : ':'}${pad(ff)}`;
}

export function parseTC(str, rate) {
  const s = String(str ?? '').trim();
  const m = /^(-)?(\d{1,3})[:;.](\d{1,2})[:;.](\d{1,2})[:;.](\d{1,3})$/.exec(s);
  if (!m) throw new Error('Use the format HH:MM:SS:FF');
  const [, neg, H, M, S, F] = m;
  const hh = +H, mm = +M, ss = +S, ff = +F;
  if (mm > 59 || ss > 59) throw new Error('Minutes and seconds must be 0–59');
  if (ff >= rate.nominal) throw new Error(`Frames must be 0–${rate.nominal - 1} at this frame rate`);
  let total;
  if (rate.df) {
    const drop = rate.nominal === 60 ? 4 : 2;
    if (ss === 0 && ff < drop && mm % 10 !== 0) throw new Error(`${pad(hh)}:${pad(mm)}:00;${pad(ff)} does not exist in drop-frame timecode`);
    const totalMinutes = hh * 60 + mm;
    total = (hh * 3600 + mm * 60 + ss) * rate.nominal + ff - drop * (totalMinutes - Math.floor(totalMinutes / 10));
  } else {
    total = (hh * 3600 + mm * 60 + ss) * rate.nominal + ff;
  }
  return neg ? -total : total;
}

export function framesToSeconds(frames, rate) { return frames / rate.fps; }

// ---------------- Beats ----------------
export function framesPerBeat(bpm, fps) {
  if (!(bpm > 0) || !(fps > 0)) throw new Error('BPM and fps must be positive');
  return (fps * 60) / bpm;
}
// Cut points (frame numbers) for n beats, rounded to nearest frame without cumulative drift.
export function beatFrames(bpm, fps, n = 16, offsetFrames = 0) {
  const fpb = framesPerBeat(bpm, fps);
  return Array.from({ length: n }, (_, i) => Math.round(offsetFrames + i * fpb));
}
export function bpmFromTaps(times) {
  if (!Array.isArray(times) || times.length < 2) return null;
  const recent = times.slice(-9);
  const gaps = [];
  for (let i = 1; i < recent.length; i++) gaps.push(recent[i] - recent[i - 1]);
  const valid = gaps.filter((g) => g > 150 && g < 3000);
  if (!valid.length) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round((60000 / avg) * 10) / 10;
}

// ---------------- Lens / DoF ----------------
export const SENSORS = [
  { id: 'ff', name: 'Full Frame (36×24)', w: 36, h: 24 },
  { id: 'vv', name: 'Large Format / LF (36.7×25.5)', w: 36.7, h: 25.5 },
  { id: 's35', name: 'Super 35 (24.9×18.7)', w: 24.89, h: 18.66 },
  { id: 'apsc', name: 'APS-C (23.6×15.6)', w: 23.6, h: 15.6 },
  { id: 'mft', name: 'Micro Four Thirds (17.3×13)', w: 17.3, h: 13 },
  { id: '1in', name: '1-inch (13.2×8.8)', w: 13.2, h: 8.8 },
  { id: 'phone', name: 'Phone main camera (~9.8×7.4)', w: 9.8, h: 7.4 },
];
const FF_DIAG = Math.hypot(36, 24);
export function lensCalc({ sensor, focal, aperture, distance }) {
  if (!(focal > 0) || !(aperture > 0) || !(distance > 0)) throw new Error('Focal length, aperture and distance must be positive');
  const diag = Math.hypot(sensor.w, sensor.h);
  const crop = FF_DIAG / diag;
  const c = 0.03 / crop; // circle of confusion in mm
  const f = focal;
  const s = distance * 1000; // m → mm
  if (s <= f) throw new Error('Focus distance must be greater than the focal length');
  const H = (f * f) / (aperture * c) + f;
  const near = (s * (H - f)) / (H + s - 2 * f);
  const far = s >= H ? Infinity : (s * (H - f)) / (H - s);
  const hfov = 2 * Math.atan(sensor.w / (2 * f)) * (180 / Math.PI);
  const vfov = 2 * Math.atan(sensor.h / (2 * f)) * (180 / Math.PI);
  return {
    crop, coc: c, hyperfocal: H / 1000, near: near / 1000, far: far === Infinity ? Infinity : far / 1000,
    total: far === Infinity ? Infinity : (far - near) / 1000, hfov, vfov,
    eqFocal: f * crop, eqAperture: aperture * crop,
  };
}

// ---------------- Bitrate ----------------
// Reference data rates at 1920×1080 @ 29.97 fps (Mbps). Intra codecs from vendor white papers; long-GOP are typical.
export const CODECS = [
  { id: 'prores-proxy', name: 'Apple ProRes 422 Proxy', mbps: 45, intra: true },
  { id: 'prores-lt', name: 'Apple ProRes 422 LT', mbps: 102, intra: true },
  { id: 'prores-422', name: 'Apple ProRes 422', mbps: 147, intra: true },
  { id: 'prores-hq', name: 'Apple ProRes 422 HQ', mbps: 220, intra: true },
  { id: 'prores-4444', name: 'Apple ProRes 4444', mbps: 330, intra: true },
  { id: 'prores-xq', name: 'Apple ProRes 4444 XQ', mbps: 500, intra: true },
  { id: 'dnxhr-lb', name: 'Avid DNxHR LB', mbps: 36, intra: true },
  { id: 'dnxhr-sq', name: 'Avid DNxHR SQ', mbps: 116, intra: true },
  { id: 'dnxhr-hq', name: 'Avid DNxHR HQ / HQX', mbps: 176, intra: true },
  { id: 'dnxhr-444', name: 'Avid DNxHR 444', mbps: 352, intra: true },
  { id: 'h264-high', name: 'H.264 (high-quality delivery)', mbps: 20, intra: false },
  { id: 'hevc', name: 'H.265 / HEVC (delivery)', mbps: 10, intra: false },
  { id: 'av1', name: 'AV1 (delivery)', mbps: 7, intra: false },
  { id: 'h264-camera', name: 'Camera H.264 4:2:0 (typical)', mbps: 50, intra: false },
  { id: 'custom', name: 'Custom bitrate…', mbps: null, intra: false },
];
export const RESOLUTIONS = [
  { id: 'hd', name: 'HD 1920×1080', w: 1920, h: 1080 },
  { id: 'uhd', name: 'UHD 3840×2160', w: 3840, h: 2160 },
  { id: 'dci4k', name: 'DCI 4K 4096×2160', w: 4096, h: 2160 },
  { id: '6k', name: '6K 6144×3240', w: 6144, h: 3240 },
  { id: '8k', name: '8K 7680×4320', w: 7680, h: 4320 },
  { id: '720', name: 'HD 1280×720', w: 1280, h: 720 },
  { id: 'vert', name: 'Vertical 1080×1920', w: 1080, h: 1920 },
];
export function estimateBitrate(codec, res, fps) {
  const scale = (res.w * res.h) / (1920 * 1080);
  // Intra codecs scale ~linearly with pixels and fps. Long-GOP scales sub-linearly with resolution.
  const pixelFactor = codec.intra ? scale : Math.pow(scale, 0.75);
  return codec.mbps * pixelFactor * (fps / 29.97);
}
export function storageCalc({ mbps, seconds, streams = 1, audioTracks = 2 }) {
  if (!(mbps >= 0) || !(seconds >= 0)) throw new Error('Invalid input');
  const audioMbps = audioTracks * 1.152; // 24-bit 48 kHz PCM mono track
  const totalMbps = (mbps + audioMbps) * Math.max(1, streams);
  const bytes = (totalMbps * 1e6 / 8) * seconds;
  return { totalMbps, MBps: totalMbps / 8, GB: bytes / 1e9, TB: bytes / 1e12, GBperHour: (totalMbps * 1e6 / 8) * 3600 / 1e9 };
}

// ---------------- Color ----------------
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp01(s); l = clamp01(l);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
export function rgbToHex([r, g, b]) { return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
export const HARMONIES = {
  complementary: { name: 'Complementary', offsets: [0, 180], mood: 'Maximum contrast and energy. The basis of teal & orange: warm subjects pop off cool backgrounds.' },
  analogous: { name: 'Analogous', offsets: [-30, 0, 30], mood: 'Calm, unified and natural. Good for nostalgia, nature and romance.' },
  triadic: { name: 'Triadic', offsets: [0, 120, 240], mood: 'Vibrant and playful but balanced. Used in comedy, kids content and stylised worlds.' },
  split: { name: 'Split-complementary', offsets: [0, 150, 210], mood: 'Strong contrast with less tension than complementary. Versatile for commercials.' },
  tetradic: { name: 'Tetradic (square)', offsets: [0, 90, 180, 270], mood: 'Rich and complex. Let one hue dominate or it becomes chaotic.' },
  monochromatic: { name: 'Monochromatic', offsets: [0, 0, 0, 0], mood: 'One hue, many values. Strong, stylised mood, like The Matrix green or noir blue.' },
};
export function harmony(type, h, s, l) {
  const def = HARMONIES[type] || HARMONIES.complementary;
  if (type === 'monochromatic') return [0.25, 0.42, 0.6, 0.78].map((ll) => rgbToHex(hslToRgb(h, s, ll)));
  return def.offsets.map((o) => rgbToHex(hslToRgb(h + o, s, l)));
}

// Grade parameters → per-channel 1D LUT (256 entries, floats 0..1+) for separable ops.
export function buildGradeLUT(p) {
  const luts = [new Float32Array(256), new Float32Array(256), new Float32Array(256)];
  const temp = p.temperature || 0, tint = p.tint || 0;
  const wb = [1 + temp * 0.12 + tint * 0.04, 1 - tint * 0.08, 1 - temp * 0.12 + tint * 0.04];
  for (let c = 0; c < 3; c++) {
    const lift = (p.lift || 0) + (p.liftRGB ? p.liftRGB[c] : 0);
    const gamma = Math.max(0.1, (p.gamma ?? 1) + (p.gammaRGB ? p.gammaRGB[c] : 0));
    const gain = Math.max(0, (p.gain ?? 1) + (p.gainRGB ? p.gainRGB[c] : 0));
    for (let i = 0; i < 256; i++) {
      let v = i / 255;
      v = v * wb[c] + (p.offset || 0);
      v = gain * (v + lift * (1 - v)); // lift raises blacks, gain scales whites
      v = v <= 0 ? 0 : Math.pow(v, 1 / gamma);
      v = (v - (p.pivot ?? 0.435)) * (p.contrast ?? 1) + (p.pivot ?? 0.435);
      if (p.rolloff) { const k = 0.75; if (v > k) v = k + (1 - k) * Math.tanh((v - k) / (1 - k)); }
      luts[c][i] = v;
    }
  }
  return luts;
}
// Apply full grade to RGBA pixel buffer (in place on `out`).
export function applyGrade(src, out, width, height, p, luts = buildGradeLUT(p)) {
  const [lr, lg, lb] = luts;
  const sat = p.saturation ?? 1;
  const sh = p.shadowTint || [0, 0, 0], hi = p.highlightTint || [0, 0, 0];
  const vig = p.vignette || 0;
  const cx = width / 2, cy = height / 2, maxd = Math.hypot(cx, cy);
  const fade = p.fade || 0;
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i += 4) {
      let r = lr[src[i]], g = lg[src[i + 1]], b = lb[src[i + 2]];
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = Y + (r - Y) * sat; g = Y + (g - Y) * sat; b = Y + (b - Y) * sat;
      const s2 = (1 - clamp01(Y)) ** 2, h2 = clamp01(Y) ** 2;
      r += sh[0] * s2 + hi[0] * h2; g += sh[1] * s2 + hi[1] * h2; b += sh[2] * s2 + hi[2] * h2;
      if (fade) { r = fade + r * (1 - fade); g = fade + g * (1 - fade); b = fade + b * (1 - fade); }
      if (vig) { const d = Math.hypot(x - cx, y - cy) / maxd; const k = 1 - vig * d * d; r *= k; g *= k; b *= k; }
      out[i] = clamp01(r) * 255; out[i + 1] = clamp01(g) * 255; out[i + 2] = clamp01(b) * 255; out[i + 3] = src[i + 3];
    }
  }
  return out;
}
export const LOOK_PRESETS = {
  neutral: { name: 'Neutral (reset)', p: {} },
  tealOrange: { name: 'Teal & Orange', p: { contrast: 1.12, saturation: 1.1, shadowTint: [-0.05, 0.02, 0.07], highlightTint: [0.07, 0.02, -0.06], temperature: 0.1 } },
  bleach: { name: 'Bleach Bypass', p: { contrast: 1.35, saturation: 0.45, gamma: 0.95, gain: 1.05 } },
  dayNight: { name: 'Day for Night', p: { offset: -0.12, gain: 0.7, saturation: 0.55, temperature: -0.8, contrast: 1.15, shadowTint: [-0.02, 0, 0.05] } },
  vintage: { name: 'Vintage 70s', p: { fade: 0.08, contrast: 0.9, saturation: 0.85, temperature: 0.35, shadowTint: [0, 0.03, 0.01], highlightTint: [0.05, 0.03, -0.03], rolloff: true } },
  noir: { name: 'Noir', p: { saturation: 0, contrast: 1.45, gamma: 0.9, vignette: 0.6 } },
  film: { name: 'Film print (2383-style)', p: { contrast: 1.15, saturation: 0.92, rolloff: true, shadowTint: [-0.02, 0.01, 0.03], highlightTint: [0.04, 0.02, -0.02], vignette: 0.2 } },
  warmCast: { name: 'Problem: warm cast (fix me)', p: { temperature: 0.9, tint: 0.2, offset: 0.03 }, problem: true },
  flatLog: { name: 'Problem: flat log (fix me)', p: { contrast: 0.55, saturation: 0.6, lift: 0.12, gain: 0.85 }, problem: true },
};

// Chroma key alpha for a pixel (0 = transparent, 1 = opaque).
export function rgbToCbCr(r, g, b) {
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [(b - Y) / 1.8556, (r - Y) / 1.5748, Y];
}
export function keyAlpha(r, g, b, key, tolerance, softness) {
  const [cb, cr] = rgbToCbCr(r / 255, g / 255, b / 255);
  const [kb, kr] = rgbToCbCr(key[0] / 255, key[1] / 255, key[2] / 255);
  const d = Math.hypot(cb - kb, cr - kr);
  if (d <= tolerance) return 0;
  if (softness <= 0 || d >= tolerance + softness) return 1;
  const t = (d - tolerance) / softness;
  return t * t * (3 - 2 * t);
}
export function suppressSpill(r, g, b, amount) {
  const limit = (r + b) / 2;
  return g > limit ? g - (g - limit) * amount : g;
}

// ---------------- Easing ----------------
// Cubic bezier easing from (0,0) to (1,1) with control points (x1,y1), (x2,y2).
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6) return t; if (Math.abs(d) < 1e-6) break; t -= e / d; }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 40; i++) { const v = sx(t); if (Math.abs(v - x) < 1e-6) return t; if (x > v) lo = t; else hi = t; t = (lo + hi) / 2; }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
}
export const EASE_PRESETS = {
  linear: [0, 0, 1, 1], ease: [0.25, 0.1, 0.25, 1], 'ease-in': [0.42, 0, 1, 1], 'ease-out': [0, 0, 0.58, 1], 'ease-in-out': [0.42, 0, 0.58, 1],
  'expo-out': [0.16, 1, 0.3, 1], 'back-out': [0.34, 1.56, 0.64, 1], 'snappy': [0.7, 0, 0.2, 1], 'anticipate': [0.6, -0.28, 0.735, 0.045],
};
