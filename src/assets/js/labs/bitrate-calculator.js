import { initLab, h, select, numberInput, resultGrid, clear } from './_lab.js';
import { CODECS, RESOLUTIONS, estimateBitrate, storageCalc } from './lib.js';

const root = initLab('bitrate-calculator');
if (root) {
  const st = { codec: 'prores-hq', res: 'uhd', fps: 25, custom: 50, hours: 1, minutes: 0, cams: 1, audio: 2, drive: 2 };
  const out = h('div');
  const num = (v, min, max, def) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : def; };
  const fmtSize = (gb) => (gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(gb < 10 ? 2 : 1)} GB`);

  function update() {
    const codec = CODECS.find((c) => c.id === st.codec);
    const res = RESOLUTIONS.find((r) => r.id === st.res);
    const mbps = codec.mbps == null ? num(st.custom, 0.1, 20000, 50) : estimateBitrate(codec, res, st.fps);
    const seconds = num(st.hours, 0, 1000, 0) * 3600 + num(st.minutes, 0, 59, 0) * 60;
    const r = storageCalc({ mbps, seconds, streams: num(st.cams, 1, 50, 1), audioTracks: num(st.audio, 0, 64, 2) });
    const driveGB = num(st.drive, 0.01, 1000, 2) * 1000;
    const hoursFit = r.GBperHour > 0 ? driveGB / r.GBperHour : 0;
    customRow.row.hidden = codec.mbps != null;
    clear(out).append(
      resultGrid([
        ['Video bitrate', `${mbps.toFixed(1)} Mbps`], ['Total data rate', `${r.totalMbps.toFixed(1)} Mbps`], ['Read speed needed', `${r.MBps.toFixed(1)} MB/s`],
        ['Per hour', fmtSize(r.GBperHour)], ['Total for duration', fmtSize(r.GB)], ['Hours on drive', `${hoursFit.toFixed(1)} h`],
      ]),
      h('p', { class: 'muted small' }, codec.intra ? 'Intra-frame codecs scale almost linearly with pixel count and frame rate, so these estimates are close to real files.' : 'Long-GOP rates vary with image complexity and encoder settings. Treat these as typical values.'),
      r.MBps > 400 ? h('p', { class: 'callout warn' }, 'This data rate needs a fast NVMe SSD or a RAID. Spinning drives (about 150–250 MB/s) will drop frames.') : null,
    );
  }
  const codecSel = select({ label: 'Codec', value: st.codec, options: CODECS.map((c) => [c.id, c.name]), onChange: (v) => { st.codec = v; update(); } });
  const resSel = select({ label: 'Resolution', value: st.res, options: RESOLUTIONS.map((r) => [r.id, r.name]), onChange: (v) => { st.res = v; update(); } });
  const fpsSel = select({ label: 'Frame rate', value: '25', options: [23.976, 24, 25, 29.97, 30, 50, 59.94, 60, 120].map((f) => [String(f), `${f} fps`]), onChange: (v) => { st.fps = Number(v); update(); } });
  const customRow = numberInput({ label: 'Custom Mbps', value: st.custom, min: 0.1, max: 20000, onInput: (v) => { st.custom = v; update(); } });
  const hrs = numberInput({ label: 'Hours', value: 1, min: 0, max: 1000, step: 1, onInput: (v) => { st.hours = v; update(); } });
  const mins = numberInput({ label: 'Minutes', value: 0, min: 0, max: 59, step: 1, onInput: (v) => { st.minutes = v; update(); } });
  const cams = numberInput({ label: 'Cameras / streams', value: 1, min: 1, max: 50, step: 1, onInput: (v) => { st.cams = v; update(); } });
  const aud = numberInput({ label: 'Audio tracks (24-bit/48k)', value: 2, min: 0, max: 64, step: 1, onInput: (v) => { st.audio = v; update(); } });
  const drv = numberInput({ label: 'Drive size (TB)', value: 2, min: 0.01, max: 1000, onInput: (v) => { st.drive = v; update(); } });
  root.append(h('div', { class: 'lab-controls' }, codecSel.row, customRow.row, resSel.row, fpsSel.row, h('div', { class: 'ctl-row' }, hrs.row, mins.row), h('div', { class: 'ctl-row' }, cams.row, aud.row, drv.row)), out,
    h('p', { class: 'muted small' }, 'Sizes use decimal units (1 GB = 10⁹ bytes), as drive makers do. Your operating system may show smaller numbers because it uses binary units.'));
  update();
}
