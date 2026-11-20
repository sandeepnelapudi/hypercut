import { initLab, h, select, slider, resultGrid, clear } from './_lab.js';
import { lensCalc, SENSORS } from './lib.js';

const root = initLab('dof-lens');
if (root) {
  const st = { sensor: SENSORS[0], focal: 50, aperture: 2.8, distance: 3 };
  const out = h('div');
  const cv = h('canvas', { width: 900, height: 180, role: 'img', 'aria-label': 'Depth of field diagram' });
  const fmtM = (m) => (m === Infinity ? '∞' : m >= 100 ? `${m.toFixed(0)} m` : m >= 1 ? `${m.toFixed(2)} m` : `${(m * 100).toFixed(1)} cm`);
  const xOf = (m) => 60 + (Math.log10(Math.min(Math.max(m, 0.1), 1000) / 0.1) / 4) * 800; // 0.1m..1000m log

  function draw(r) {
    const c = cv.getContext('2d');
    c.fillStyle = '#0b0b12'; c.fillRect(0, 0, 900, 180);
    // focus zone
    const xn = xOf(r.near), xf = r.far === Infinity ? 880 : xOf(r.far);
    const g = c.createLinearGradient(xn, 0, xf, 0); g.addColorStop(0, 'rgba(0,224,255,.15)'); g.addColorStop(.5, 'rgba(0,224,255,.35)'); g.addColorStop(1, 'rgba(0,224,255,.15)');
    c.fillStyle = g; c.fillRect(xn, 30, Math.max(2, xf - xn), 110);
    c.strokeStyle = '#2a2a40'; c.beginPath(); c.moveTo(60, 140); c.lineTo(880, 140); c.stroke();
    c.fillStyle = '#a3a3bd'; c.font = '11px system-ui';
    for (const m of [0.1, 0.3, 1, 3, 10, 30, 100, 300, 1000]) { const x = xOf(m); c.fillRect(x, 140, 1, 6); c.fillText(m >= 1 ? `${m}m` : `${m * 100}cm`, x - 10, 160); }
    // camera
    c.fillStyle = '#ececf4'; c.fillRect(20, 70, 30, 30); c.fillRect(48, 78, 12, 14);
    // subject
    const xs = xOf(st.distance);
    c.fillStyle = '#ff3d7f'; c.beginPath(); c.arc(xs, 70, 12, 0, Math.PI * 2); c.fill(); c.fillRect(xs - 8, 82, 16, 40);
    c.fillStyle = '#ececf4'; c.font = '600 12px system-ui';
    c.fillText(`Near ${fmtM(r.near)}`, Math.max(60, xn - 40), 24); c.fillText(`Far ${fmtM(r.far)}`, Math.min(800, xf - 30), 24);
    if (r.hyperfocal < 1000) { const xh = xOf(r.hyperfocal); c.strokeStyle = '#ffd23f'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(xh, 30); c.lineTo(xh, 140); c.stroke(); c.setLineDash([]); c.fillStyle = '#ffd23f'; c.fillText('H', xh + 4, 44); }
  }
  function update() {
    try {
      const r = lensCalc(st);
      clear(out).append(resultGrid([
        ['Near focus', fmtM(r.near)], ['Far focus', fmtM(r.far)], ['Total DoF', fmtM(r.total)], ['Hyperfocal', fmtM(r.hyperfocal)],
        ['Horizontal FOV', `${r.hfov.toFixed(1)}°`], ['Vertical FOV', `${r.vfov.toFixed(1)}°`], ['Crop factor', `${r.crop.toFixed(2)}×`],
        ['Full-frame equivalent', `${r.eqFocal.toFixed(0)}mm f/${r.eqAperture.toFixed(1)}`], ['Circle of confusion', `${(r.coc * 1000).toFixed(1)} µm`],
      ]));
      draw(r);
    } catch (e) { clear(out).append(h('p', { class: 'form-error' }, e.message)); }
  }
  const sensor = select({ label: 'Sensor', value: 'ff', options: SENSORS.map((s) => [s.id, s.name]), onChange: (v) => { st.sensor = SENSORS.find((s) => s.id === v) || SENSORS[0]; update(); } });
  const focal = slider({ label: 'Focal length', min: 8, max: 300, value: 50, fmt: (v) => `${v} mm`, onInput: (v) => { st.focal = v; update(); } });
  const stops = [1.2, 1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  const ap = slider({ label: 'Aperture', min: 0, max: stops.length - 1, value: 4, fmt: (i) => `f/${stops[i]}`, onInput: (i) => { st.aperture = stops[i]; update(); } });
  const dist = slider({ label: 'Focus distance', min: 0.3, max: 30, step: 0.1, value: 3, fmt: (v) => `${v.toFixed(1)} m`, onInput: (v) => { st.distance = v; update(); } });
  root.append(sensor.row, h('div', { class: 'lab-controls' }, focal.row, ap.row, dist.row), h('div', { class: 'canvas-wrap' }, cv), out,
    h('p', { class: 'muted small' }, 'Try it: 85mm at f/1.4 at 2 m on full frame gives a razor-thin focus band, while a phone at the same framing keeps almost everything sharp.'));
  update();
}
