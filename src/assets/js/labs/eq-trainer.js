import { initLab, h, slider, clear, toast } from './_lab.js';

const BANDS = [
  { f: 63, l: '63 Hz', d: 'Sub/rumble' }, { f: 125, l: '125 Hz', d: 'Boom/warmth' }, { f: 250, l: '250 Hz', d: 'Mud' }, { f: 500, l: '500 Hz', d: 'Boxy' },
  { f: 1000, l: '1 kHz', d: 'Honk/nasal' }, { f: 2000, l: '2 kHz', d: 'Bite' }, { f: 4000, l: '4 kHz', d: 'Presence/harsh' }, { f: 8000, l: '8 kHz', d: 'Sibilance' }, { f: 12000, l: '12 kHz', d: 'Air' },
];
// Levels: more choices and less gain as you progress.
const LEVELS = [
  { choices: [125, 1000, 8000], gain: 12 }, { choices: [125, 500, 2000, 8000], gain: 10 }, { choices: [63, 250, 1000, 4000, 12000], gain: 9 },
  { choices: [125, 250, 500, 1000, 2000, 4000, 8000], gain: 8 }, { choices: BANDS.map((b) => b.f), gain: 6 },
];

const root = initLab('eq-trainer');
if (root) {
  let ctx = null, src = null, filter = null, master = null;
  let level = 0, target = null, boosted = true, score = 0, streak = 0, rounds = 0, playing = false, answered = false;
  const status = h('p', { class: 'key-display', role: 'status', 'aria-live': 'polite' }, 'Press Start, then listen.');
  const answers = h('div', { class: 'answers' });
  const stats = h('p', { class: 'muted' });

  function pinkNoise(ac) {
    const len = ac.sampleRate * 4; const buf = ac.createBuffer(1, len, ac.sampleRate); const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) { // Paul Kellet's refined pink noise filter
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
    const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; return s;
  }
  async function ensureAudio() {
    if (ctx) { await ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    filter = ctx.createBiquadFilter(); filter.type = 'peaking'; filter.Q.value = 1.4;
    master = ctx.createGain(); master.gain.value = vol.value;
    src = pinkNoise(ctx); src.connect(filter).connect(master).connect(ctx.destination); src.start();
    await ctx.resume();
  }
  function setBoost(on) {
    boosted = on;
    if (filter) filter.gain.setTargetAtTime(on ? LEVELS[level].gain : 0, ctx.currentTime, 0.02);
    ab.textContent = on ? 'Hearing: BOOSTED (switch to flat)' : 'Hearing: FLAT (switch to boosted)';
  }
  function newRound() {
    const lv = LEVELS[level];
    target = lv.choices[Math.floor(Math.random() * lv.choices.length)];
    if (filter) filter.frequency.setValueAtTime(target, ctx.currentTime);
    answered = false;
    setBoost(true);
    status.textContent = `Level ${level + 1}: which band is boosted by ${lv.gain} dB?`;
    clear(answers).append(...lv.choices.map((f) => {
      const b = BANDS.find((x) => x.f === f);
      const btn = h('button', { class: 'btn btn-ghost', type: 'button', title: b.d }, b.l);
      btn.addEventListener('click', () => guess(f, btn));
      return btn;
    }));
  }
  function guess(f, btn) {
    if (answered || !playing) return;
    answered = true; rounds++;
    const ok = f === target;
    btn.classList.add(ok ? 'right' : 'wrongc');
    if (!ok) [...answers.children].find((b) => b.textContent === BANDS.find((x) => x.f === target).l)?.classList.add('right');
    if (ok) { score++; streak++; } else streak = 0;
    const band = BANDS.find((x) => x.f === target);
    status.textContent = ok ? `✓ Correct: ${band.l} (${band.d})` : `✗ It was ${band.l} (${band.d})`;
    if (streak >= 4 && level < LEVELS.length - 1) { level++; streak = 0; toast(`Level up! Level ${level + 1} 🎧`, 'xp'); }
    stats.textContent = `Score ${score}/${rounds} · Level ${level + 1}/${LEVELS.length} · Streak ${streak} (4 in a row = level up)`;
    setTimeout(() => { if (playing) newRound(); }, 1400);
  }
  const start = h('button', { class: 'btn', type: 'button' }, '▶ Start training');
  start.addEventListener('click', async () => {
    try {
      if (playing) { playing = false; await ctx.suspend(); start.textContent = '▶ Start training'; status.textContent = 'Paused.'; return; }
      await ensureAudio(); playing = true; start.textContent = '■ Stop'; newRound();
    } catch { toast('Web Audio is not available in this browser.', 'err'); }
  });
  const ab = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Hearing: BOOSTED');
  ab.addEventListener('click', () => { if (playing) setBoost(!boosted); });
  const vol = slider({ label: 'Volume', min: 0, max: 0.5, step: 0.01, value: 0.15, fmt: (v) => `${Math.round(v * 200)}%`, onInput: (v) => { if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.02); } });
  root.append(h('p', { class: 'callout warn' }, '🎧 Use headphones and start with the volume low. Pink noise can be loud.'),
    h('div', { class: 'ctl-row' }, start, ab), vol.row, status, answers, stats);
  stats.textContent = 'Score 0/0 · Level 1';
}
