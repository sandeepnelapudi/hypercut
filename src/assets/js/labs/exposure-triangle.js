import { initLab, h, select, rafThrottle, missionPanel, clear, resultGrid } from './_lab.js';
import { SHUTTERS, APERTURES, ISOS, SCENES, exposureOffset, shutterAngle, fmtShutter } from './lib2.js';

const ND = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10];
const root = initLab('exposure-triangle');
if (root) {
  const st = { scene: 'overcast', fps: 25, shutter: 3, aperture: 4, iso: 0, nd: 0 };
  const W = 640, H = 360;
  const cv = h('canvas', { width: W, height: H, role: 'img', 'aria-label': 'Simulated camera image' });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  const small = document.createElement('canvas');
  const info = h('div');
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('span'));
  const meterLabels = h('div', { class: 'meter-labels', 'aria-hidden': 'true' }, h('span', {}, '−3 stops (dark)'), h('span', {}, 'Correct'), h('span', {}, '+3 stops (blown out)'));

  function paintBackground() {
    const c = bg.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fa6cf'); g.addColorStop(0.6, '#c9d7e3'); g.addColorStop(1, '#6b6f5f');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const cols = ['#55606e', '#8a7461', '#6d7f6a', '#9a8f86', '#4f5a68', '#7b6a7a'];
    for (let i = 0; i < 12; i++) { c.fillStyle = cols[i % cols.length]; const bw = 40 + (i * 23) % 50, bh = 90 + (i * 47) % 140; c.fillRect(i * 56 - 10, H * 0.72 - bh, bw, bh); c.fillStyle = 'rgba(255,240,180,.8)'; for (let w = 0; w < 6; w++) c.fillRect(i * 56 + (w % 2) * 14, H * 0.72 - bh + 12 + Math.floor(w / 2) * 22, 7, 9); }
    c.fillStyle = '#3d4a35'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(30 + i * 80, H * 0.74, 34, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#5b5b55'; c.fillRect(0, H * 0.78, W, H * 0.22);
  }
  paintBackground();
  const scene = () => SCENES.find((s) => s.id === st.scene);
  const settings = () => ({ aperture: APERTURES[st.aperture], shutter: SHUTTERS[st.shutter], iso: ISOS[st.iso], nd: ND[st.nd] });
  const offset = () => exposureOffset(scene().ev, settings());
  const angle = () => shutterAngle(SHUTTERS[st.shutter], st.fps);

  const render = rafThrottle(() => {
    const s = settings();
    // Background defocus: wider aperture = more blur (downscale/upscale trick works in every browser).
    const blur = Math.max(0, 9 * (2.8 / s.aperture) - 1.5);
    const f = 1 / (1 + blur);
    small.width = Math.max(8, Math.round(W * f)); small.height = Math.max(8, Math.round(H * f));
    const sc = small.getContext('2d'); sc.imageSmoothingEnabled = true; sc.drawImage(bg, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(small, 0, 0, W, H);
    // Subject (sharp, in focus)
    const cx = W * 0.32, cy = H * 0.5;
    ctx.fillStyle = '#2d3a5a'; ctx.beginPath(); ctx.ellipse(cx, H + 30, 120, 140, 0, Math.PI, 0); ctx.fill();
    const face = ctx.createRadialGradient(cx - 18, cy - 20, 8, cx, cy, 80); face.addColorStop(0, '#f0c4a2'); face.addColorStop(1, '#b07a5a');
    ctx.fillStyle = face; ctx.beginPath(); ctx.ellipse(cx, cy, 58, 74, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.ellipse(cx, cy - 50, 62, 34, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(cx - 20, cy - 6, 5, 0, Math.PI * 2); ctx.arc(cx + 20, cy - 6, 5, 0, Math.PI * 2); ctx.fill();
    // Moving cyclist/ball: motion blur length = speed × exposure time
    const speed = 1400; const streak = Math.min(300, speed * s.shutter);
    const bx = W * 0.7, by = H * 0.68;
    const n = Math.max(1, Math.round(streak / 3));
    ctx.globalAlpha = Math.min(1, 1.6 / n + 0.04);
    for (let i = 0; i < n; i++) { ctx.fillStyle = '#e94b3c'; ctx.beginPath(); ctx.arc(bx + i * (streak / n) - streak / 2, by, 20, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // Exposure + sensor noise
    const off = offset();
    const gain = Math.pow(2, off);
    const noise = 2.2 * Math.sqrt(s.iso / 100);
    const img = ctx.getImageData(0, 0, W, H); const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const nz = (Math.random() - 0.5) * noise * 2;
      for (let c = 0; c < 3; c++) {
        const lin = Math.pow(d[i + c] / 255, 2.2) * gain;
        let v = Math.pow(Math.min(1, lin), 1 / 2.2) * 255 + nz * (1.4 - d[i + c] / 255);
        d[i + c] = v;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = '#fff'; ctx.font = '600 13px system-ui';
    ctx.fillText(`${scene().name} · ${st.fps} fps · ${fmtShutter(s.shutter)} · f/${s.aperture} · ISO ${s.iso}${s.nd ? ` · ND ${2 ** s.nd} (${s.nd} stops)` : ''}`, 10, 18);
    // Meter + info
    meter.firstChild.style.left = `${Math.max(0, Math.min(100, ((off + 3) / 6) * 100))}%`;
    const a = angle();
    const warn = [];
    if (Math.abs(a - 180) > 25) warn.push(a < 180 ? `Shutter angle ${Math.round(a)}°: motion will look choppy and staccato.` : `Shutter angle ${Math.round(a)}°: motion will look smeared.`);
    if (s.iso >= 3200) warn.push('High ISO: visible noise, especially in the shadows.');
    if (off > 1) warn.push('Overexposed: highlights are clipping. Add ND, close the aperture or lower the ISO.');
    if (off < -1) warn.push('Underexposed: open the aperture, raise the ISO or use a slower shutter.');
    clear(info).append(resultGrid([['Exposure', `${off >= 0 ? '+' : ''}${off.toFixed(1)} stops`], ['Shutter angle', `${Math.round(a)}°`], ['Depth of field', s.aperture <= 2 ? 'Very shallow' : s.aperture <= 4 ? 'Shallow' : s.aperture <= 8 ? 'Medium' : 'Deep']]),
      warn.length ? h('ul', { class: 'warn-text' }, warn.map((w) => h('li', {}, w))) : h('p', { class: 'muted small' }, '✓ Settings look healthy.'));
    missions.check();
  });

  const sel = (label, key, options, num = true) => { const s = select({ label, value: String(st[key]), options, onChange: (v) => { st[key] = num ? Number(v) : v; render(); } }); return s; };
  const ctl = {
    scene: sel('Light', 'scene', SCENES.map((s) => [s.id, `${s.name} (EV ${s.ev})`]), false),
    fps: sel('Frame rate', 'fps', [24, 25, 30, 50, 60].map((f) => [String(f), `${f} fps`])),
    shutter: sel('Shutter', 'shutter', SHUTTERS.map((s, i) => [String(i), fmtShutter(s)])),
    aperture: sel('Aperture', 'aperture', APERTURES.map((a, i) => [String(i), `f/${a}`])),
    iso: sel('ISO', 'iso', ISOS.map((v, i) => [String(i), String(v)])),
    nd: sel('ND filter', 'nd', ND.map((n, i) => [String(i), n ? `ND${2 ** n} (−${n} stops)` : 'None'])),
  };
  const set = (o) => { Object.assign(st, o); for (const k of Object.keys(ctl)) ctl[k].el.value = String(st[k]); render(); };
  const ok = (tol = 0.5) => Math.abs(offset()) <= tol;
  const missions = missionPanel([
    { title: 'Cinematic in bright sun', hint: 'Bright sun, 25 fps. Keep a 180° shutter (1/50) and shoot at f/2.8 or wider for shallow focus, yet expose correctly (±½ stop). You will need an ND filter.', setup: () => set({ scene: 'sun', fps: 25, shutter: 3, aperture: 0, iso: 0, nd: 0 }), test: () => st.scene === 'sun' && st.fps === 25 && Math.abs(angle() - 180) <= 10 && APERTURES[st.aperture] <= 2.8 && ok() },
    { title: 'Night street, no cheating', hint: 'Night street at 24 fps. Keep the 180° rule (1/48 or 1/50) and ISO no higher than 3200, and expose correctly.', setup: () => set({ scene: 'night', fps: 24, shutter: 2, aperture: 5, iso: 0, nd: 0 }), test: () => st.scene === 'night' && st.fps === 24 && Math.abs(angle() - 180) <= 10 && ISOS[st.iso] <= 3200 && ok() },
    { title: 'Crisp sports slow-motion', hint: 'Overcast day at 60 fps. Use 1/250 or faster for crisp frames, ISO 400 or lower, and expose correctly.', setup: () => set({ scene: 'overcast', fps: 60, shutter: 3, aperture: 4, iso: 0, nd: 0 }), test: () => st.scene === 'overcast' && st.fps === 60 && SHUTTERS[st.shutter] <= 1 / 250 && ISOS[st.iso] <= 400 && ok() },
  ], { heading: 'Missions: think like a cinematographer' });

  root.append(h('div', { class: 'ctl-row' }, ctl.scene.row, ctl.fps.row),
    h('div', { class: 'lab-grid-2' },
      h('div', {}, h('div', { class: 'canvas-wrap' }, cv), meter, meterLabels),
      h('div', { class: 'lab-controls' }, ctl.shutter.row, ctl.aperture.row, ctl.iso.row, ctl.nd.row, info)),
    missions.el,
    h('p', { class: 'muted small' }, 'Every stop doubles or halves the light. In video the shutter is locked by the 180° rule, so control exposure with aperture, ND filters and ISO, in that order.'));
  render();
}
