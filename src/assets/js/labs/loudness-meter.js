import { initLab, h, select, clear, resultGrid, toast } from './_lab.js';
import { measureLoudness, LOUDNESS_TARGETS, gainAdvice } from './lib2.js';

const MAX_BYTES = 500 * 1024 * 1024;
const MAX_SECONDS = 30 * 60;

const root = initLab('loudness-meter');
if (root) {
  let target = LOUDNESS_TARGETS[0];
  let last = null;
  const status = h('p', { class: 'muted', role: 'status', 'aria-live': 'polite' }, 'Load an audio or video file. It is analysed in your browser and never uploaded.');
  const out = h('div');
  const graph = h('canvas', { width: 900, height: 200, role: 'img', 'aria-label': 'Momentary loudness over time' });

  function fmt(v) { return Number.isFinite(v) ? v.toFixed(1) : '−∞'; }
  function show(m, name) {
    last = { m, name };
    const adv = gainAdvice(m, target);
    clear(out).append(
      resultGrid([['Integrated loudness', `${fmt(m.integrated)} LUFS`], ['Max momentary', `${fmt(m.momentaryMax)} LUFS`], ['Sample peak', `${fmt(m.samplePeakDb)} dBFS`], ['Duration', `${Math.floor(m.duration / 60)}m ${(m.duration % 60).toFixed(1)}s`]]),
      adv.gain == null ? h('p', { class: 'warn-text' }, 'This file is silent or too short (under 0.4 seconds) to measure.') : h('div', { class: Math.abs(adv.gain) <= 1 ? 'callout tip' : 'callout warn' },
        h('strong', {}, `${target.name} target: ${target.lufs} LUFS. `),
        Math.abs(adv.gain) <= 1 ? '✓ On target (within ±1 LU). ' : `Change the gain by ${adv.gain > 0 ? '+' : ''}${adv.gain.toFixed(1)} dB. `,
        adv.needsLimiter ? `After that change, peaks would reach about ${adv.peakAfter.toFixed(1)} dBFS, above the ${target.tp} dBTP ceiling, so add a limiter on the master.` : 'Peaks stay under the ceiling.'),
      h('p', { class: 'muted small' }, 'Measured with ITU-R BS.1770-4 K-weighting and gating, the same method as Premiere, Resolve and broadcast meters. True peak needs oversampling, so treat the sample peak as a lower bound and leave 0.5 dB of extra headroom.'));
    const c = graph.getContext('2d'); c.fillStyle = '#0b0b12'; c.fillRect(0, 0, 900, 200);
    const y = (l) => 190 - ((Math.max(-50, Math.min(0, l)) + 50) / 50) * 180;
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.fillStyle = '#a3a3bd'; c.font = '10px system-ui';
    for (let l = -50; l <= 0; l += 10) { c.beginPath(); c.moveTo(30, y(l)); c.lineTo(900, y(l)); c.stroke(); c.fillText(String(l), 4, y(l) + 3); }
    c.strokeStyle = '#ffd23f'; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(30, y(target.lufs)); c.lineTo(900, y(target.lufs)); c.stroke(); c.setLineDash([]);
    const s = m.series || [];
    if (s.length) { c.strokeStyle = '#00e0ff'; c.beginPath(); s.forEach((l, i) => { const x = 30 + (i / Math.max(1, s.length - 1)) * 868; i ? c.lineTo(x, y(l)) : c.moveTo(x, y(l)); }); c.stroke(); }
  }
  async function analyse(buffer, name) {
    status.textContent = `Analysing ${name}…`;
    await new Promise((r) => setTimeout(r, 30));
    const fs = buffer.sampleRate;
    const n = Math.min(buffer.length, Math.round(MAX_SECONDS * fs));
    const chans = Array.from({ length: Math.min(buffer.numberOfChannels, 6) }, (_, i) => buffer.getChannelData(i).subarray(0, n));
    const m = measureLoudness(chans, fs);
    show(m, name);
    status.textContent = `${name}: ${chans.length} channel${chans.length > 1 ? 's' : ''}, ${fs} Hz${buffer.length > n ? ' (only the first 30 minutes were analysed)' : ''}.`;
  }
  let actx = null;
  const ac = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());
  const input = h('input', { type: 'file', accept: 'audio/*,video/*', 'aria-label': 'Choose an audio or video file' });
  input.addEventListener('change', async () => {
    const f = input.files && input.files[0]; input.value = '';
    if (!f) return;
    if (!/^(audio|video)\//.test(f.type) && !/\.(wav|mp3|m4a|aac|flac|ogg|mp4|mov|webm)$/i.test(f.name)) { toast('Please choose an audio or video file.', 'err'); return; }
    if (f.size > MAX_BYTES) { toast('File is larger than 500 MB. Export an audio-only WAV and try that instead.', 'err'); return; }
    try {
      status.textContent = `Decoding ${f.name}…`;
      const buf = await ac().decodeAudioData(await f.arrayBuffer());
      await analyse(buf, f.name);
    } catch { status.textContent = 'This browser could not decode that file. Try a WAV, MP3 or M4A export.'; toast('Could not decode the file.', 'err'); }
  });
  const tone = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' }, 'Test tone: 1 kHz at −20 dBFS');
  tone.addEventListener('click', async () => {
    try {
      const fs = 48000, b = ac().createBuffer(2, fs * 5, fs);
      for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = 0.1 * Math.sin((2 * Math.PI * 997 * i) / fs); }
      await analyse(b, 'Test tone (stereo, −20 dBFS)');
    } catch { toast('Web Audio is not available in this browser.', 'err'); }
  });
  const tgt = select({ label: 'Delivery target', value: target.id, options: LOUDNESS_TARGETS.map((t) => [t.id, `${t.name}: ${t.lufs} LUFS, ${t.tp} dBTP`]), onChange: (v) => { target = LOUDNESS_TARGETS.find((t) => t.id === v); if (last) show(last.m, last.name); } });
  root.append(h('div', { class: 'ctl-row' }, h('span', { class: 'btn btn-sm file-btn' }, 'Load audio/video file', input), tone), tgt.row, status, out, h('div', { class: 'canvas-wrap' }, graph),
    h('p', { class: 'muted small' }, 'A stereo 1 kHz tone at −20 dBFS reads about −20 LUFS. Try the test tone to see the meter is accurate.'));
}
