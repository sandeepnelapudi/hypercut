import { initLab, h, select, numberInput, resultGrid, clear, toast } from './_lab.js';
import { framesPerBeat, beatFrames, bpmFromTaps, FPS_OPTIONS, framesToTC } from './lib.js';

const root = initLab('beat-sync');
if (root) {
  const st = { bpm: 120, fpsId: '24', taps: [] };
  const out = h('div');
  const table = h('div', { class: 'table-wrap' });
  const dots = h('div', { class: 'beat-dots', 'aria-hidden': 'true' }, [0, 1, 2, 3].map(() => h('span')));
  let audio = null, timer = null, beat = 0, nextTime = 0;

  function update() {
    const rate = FPS_OPTIONS.find((f) => f.id === st.fpsId) || FPS_OPTIONS[1];
    if (!(st.bpm >= 20 && st.bpm <= 400)) { clear(out).append(h('p', { class: 'form-error' }, 'BPM must be between 20 and 400.')); return; }
    const fpb = framesPerBeat(st.bpm, rate.fps);
    clear(out).append(resultGrid([['Frames per beat', fpb.toFixed(2)], ['Frames per bar (4/4)', (fpb * 4).toFixed(2)], ['Seconds per beat', (60 / st.bpm).toFixed(3)], ['Half-beat (8th note)', `${(fpb / 2).toFixed(2)} f`]]));
    const frames = beatFrames(st.bpm, rate.fps, 16);
    clear(table).append(h('table', {}, h('caption', {}, 'First 16 beat cut points from 00:00:00:00 (rounded to the nearest frame without drift)'),
      h('thead', {}, h('tr', {}, h('th', {}, 'Beat'), h('th', {}, 'Bar'), h('th', {}, 'Frame'), h('th', {}, 'Timecode'))),
      h('tbody', {}, frames.map((f, i) => h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, i % 4 === 0 ? `Bar ${i / 4 + 1} ⬇` : ''), h('td', {}, String(f)), h('td', {}, framesToTC(f, rate)))))));
  }
  function tick() {
    // Schedule clicks slightly ahead with Web Audio for sample-accurate timing.
    while (audio && nextTime < audio.currentTime + 0.1) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = beat % 4 === 0 ? 1500 : 1000;
      g.gain.setValueAtTime(0.0001, nextTime); g.gain.exponentialRampToValueAtTime(0.3, nextTime + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, nextTime + 0.06);
      o.connect(g).connect(audio.destination); o.start(nextTime); o.stop(nextTime + 0.07);
      const b = beat; const delay = Math.max(0, (nextTime - audio.currentTime) * 1000);
      setTimeout(() => { dots.querySelectorAll('span').forEach((d, i) => { d.classList.toggle('on', i === b % 4); d.classList.toggle('down', i === 0 && b % 4 === 0); }); }, delay);
      nextTime += 60 / st.bpm; beat++;
    }
  }
  const metro = h('button', { class: 'btn btn-sm', type: 'button' }, '▶ Metronome');
  metro.addEventListener('click', async () => {
    if (timer) { clearInterval(timer); timer = null; metro.textContent = '▶ Metronome'; dots.querySelectorAll('span').forEach((d) => d.classList.remove('on', 'down')); return; }
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
      beat = 0; nextTime = audio.currentTime + 0.05; timer = setInterval(tick, 25); metro.textContent = '■ Stop';
    } catch { toast('Audio is not available in this browser.', 'err'); }
  });
  const bpm = numberInput({ label: 'BPM', value: st.bpm, min: 20, max: 400, step: 0.1, onInput: (v) => { st.bpm = Number(v); update(); } });
  const fps = select({ label: 'Timeline fps', value: st.fpsId, options: FPS_OPTIONS.filter((f) => !f.df).map((f) => [f.id, f.label]), onChange: (v) => { st.fpsId = v; update(); } });
  const tap = h('button', { class: 'btn big-tap', type: 'button' }, 'TAP the beat (or press T)');
  const doTap = () => {
    const now = performance.now();
    if (st.taps.length && now - st.taps[st.taps.length - 1] > 2500) st.taps = [];
    st.taps.push(now);
    const b = bpmFromTaps(st.taps);
    if (b) { st.bpm = b; bpm.el.value = String(b); update(); tap.textContent = `${b} BPM. Keep tapping…`; } else tap.textContent = 'Keep tapping…';
  };
  tap.addEventListener('click', doTap);
  document.addEventListener('keydown', (e) => { if ((e.key === 't' || e.key === 'T') && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); doTap(); } });
  root.append(h('div', { class: 'ctl-row' }, bpm.row, fps.row, metro), tap, dots, out, table,
    h('p', { class: 'muted small' }, 'Pro tip: put the impact of a cut 1–2 frames before the beat. Audio and video are perceived slightly differently, so cutting dead on the beat can feel late.'));
  update();
}
