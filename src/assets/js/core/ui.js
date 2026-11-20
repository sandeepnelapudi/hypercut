// Safe DOM helpers. Never use innerHTML with dynamic data; build nodes instead.
const URL_OK = /^(\/(?!\/)|#|https:\/\/|mailto:)/i;

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'on') { for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn); }
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (/^on/i.test(k) || k === 'innerHTML' || k === 'srcdoc') throw new Error('Unsafe attribute: ' + k);
    else if ((k === 'href' || k === 'src' || k === 'action') && !URL_OK.test(String(v))) el.setAttribute(k, '#');
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; }

export function toast(message, type = 'ok', ms = 3200) {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const t = h('div', { class: `toast ${type === 'ok' ? '' : type}`.trim(), role: type === 'err' ? 'alert' : 'status' }, message);
  region.append(t);
  setTimeout(() => t.remove(), ms);
}

export function fmtDate(ts) {
  try { return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
}

export function debounce(fn, ms = 400) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// Highlight query terms inside text safely (returns a DocumentFragment).
export function highlight(text, terms) {
  const frag = document.createDocumentFragment();
  const s = String(text);
  const clean = terms.filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!clean.length) { frag.append(s); return frag; }
  const re = new RegExp(`(${clean.join('|')})`, 'gi');
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) frag.append(s.slice(last, m.index));
    frag.append(h('mark', {}, m[0]));
    last = m.index + m[0].length;
  }
  if (last < s.length) frag.append(s.slice(last));
  return frag;
}

// Load an image File safely for canvas processing (local only, never uploaded).
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export async function loadImageFile(file) {
  if (!file) throw new Error('No file selected.');
  if (!/^image\/(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.type)) throw new Error('Please choose a PNG, JPEG, WebP, GIF, BMP or AVIF image.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image is larger than 20 MB.');
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { throw new Error('That image could not be decoded.'); }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } catch { throw new Error('That image could not be decoded.'); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

// Fit an image into a canvas of max width, keeping aspect ratio.
export function drawFitted(ctx, img, maxW = 960, maxH = 640) {
  const w = img.width, h_ = img.height;
  const s = Math.min(maxW / w, maxH / h_, 1);
  ctx.canvas.width = Math.max(1, Math.round(w * s));
  ctx.canvas.height = Math.max(1, Math.round(h_ * s));
  ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function prefersReducedMotion() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

// Shared procedural "test scene" for labs: sky, sun, skin-tone face, foliage, shadows.
export function paintScene(ctx, w = 960, hgt = 540, { green = false } = {}) {
  ctx.canvas.width = w; ctx.canvas.height = hgt;
  if (green) {
    const g = ctx.createLinearGradient(0, 0, w, hgt);
    g.addColorStop(0, '#1fb64a'); g.addColorStop(.5, '#22c552'); g.addColorStop(1, '#18a843');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hgt);
    // uneven lighting / wrinkles
    for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(0,40,0,${0.05 + i * 0.012})`; ctx.beginPath(); ctx.ellipse(w * (0.1 + i * 0.17), hgt * 0.9, 90, 260, 0.3, 0, Math.PI * 2); ctx.fill(); }
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, hgt * 0.65);
    sky.addColorStop(0, '#3a6fb0'); sky.addColorStop(.6, '#9cc3e6'); sky.addColorStop(1, '#f2d4a8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hgt);
    const sun = ctx.createRadialGradient(w * 0.8, hgt * 0.3, 5, w * 0.8, hgt * 0.3, 90);
    sun.addColorStop(0, '#fffef5'); sun.addColorStop(.3, '#ffe9a8'); sun.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, w, hgt);
    ctx.fillStyle = '#2f5d34'; ctx.beginPath(); ctx.moveTo(0, hgt * 0.62);
    for (let x = 0; x <= w; x += 40) ctx.lineTo(x, hgt * 0.6 + Math.sin(x / 60) * 18);
    ctx.lineTo(w, hgt); ctx.lineTo(0, hgt); ctx.fill();
    const ground = ctx.createLinearGradient(0, hgt * 0.65, 0, hgt);
    ground.addColorStop(0, '#5a4a36'); ground.addColorStop(1, '#1d1712');
    ctx.fillStyle = ground; ctx.fillRect(0, hgt * 0.78, w, hgt * 0.22);
  }
  // subject: face + shirt (skin tones for vectorscope)
  const cx = w * 0.38, cy = hgt * 0.45;
  ctx.fillStyle = green ? '#c0392b' : '#b03a48';
  ctx.beginPath(); ctx.ellipse(cx, hgt * 0.98, 150, 170, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#8a5a44'; ctx.fillRect(cx - 28, cy + 50, 56, 60);
  const face = ctx.createRadialGradient(cx - 25, cy - 20, 10, cx, cy, 95);
  face.addColorStop(0, '#f1c3a3'); face.addColorStop(.6, '#d79b77'); face.addColorStop(1, '#a8694b');
  ctx.fillStyle = face; ctx.beginPath(); ctx.ellipse(cx, cy, 72, 92, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.ellipse(cx, cy - 60, 78, 45, 0, Math.PI, 0); ctx.fill();
  if (green) { // hair strands for edge detail
    ctx.strokeStyle = '#2a1a12'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) { ctx.beginPath(); const a = Math.PI + (i / 40) * Math.PI; ctx.moveTo(cx + Math.cos(a) * 70, cy - 60 + Math.sin(a) * 40); ctx.lineTo(cx + Math.cos(a) * (95 + (i % 5) * 4), cy - 60 + Math.sin(a) * (60 + (i % 3) * 6)); ctx.stroke(); }
    ctx.fillStyle = 'rgba(80,200,90,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 60, cy + 10, 18, 60, 0, 0, Math.PI * 2); ctx.fill(); // spill on cheek
  }
  ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(cx - 25, cy - 8, 6, 0, Math.PI * 2); ctx.arc(cx + 25, cy - 8, 6, 0, Math.PI * 2); ctx.fill();
  // color patches strip (chart)
  const chart = ['#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa', '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e'];
  if (!green) chart.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(w * 0.62 + (i % 6) * 52, hgt * 0.66 + Math.floor(i / 6) * 52, 48, 48); });
  // grey ramp
  if (!green) for (let i = 0; i < 11; i++) { const v = Math.round(i * 25.5); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(i * (w / 11), hgt - 22, w / 11 + 1, 22); }
}
