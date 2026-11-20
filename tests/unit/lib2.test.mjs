import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../../src/assets/js/labs/lib2.js';

test('exposure maths', () => {
  // Sunny 16: f/16, 1/100, ISO 100 ≈ EV 14.6 → bright sun (EV15) ≈ +0.4 over
  const off = L.exposureOffset(15, { aperture: 16, shutter: 1 / 100, iso: 100 });
  assert.ok(Math.abs(off - 0.36) < 0.05, String(off));
  // Each ND stop darkens by exactly one stop
  const a = L.exposureOffset(15, { aperture: 2, shutter: 1 / 50, iso: 100 });
  const b = L.exposureOffset(15, { aperture: 2, shutter: 1 / 50, iso: 100, nd: 6 });
  assert.ok(Math.abs(a - b - 6) < 1e-9);
  // Doubling ISO = +1 stop
  assert.ok(Math.abs(L.exposureOffset(8, { aperture: 2, shutter: 1 / 50, iso: 800 }) - L.exposureOffset(8, { aperture: 2, shutter: 1 / 50, iso: 400 }) - 1) < 1e-9);
  assert.equal(Math.round(L.shutterAngle(1 / 50, 25)), 180);
  assert.equal(L.fmtShutter(1 / 48), '1/48');
  assert.throws(() => L.settingsEV({ aperture: 0, shutter: 1, iso: 100 }));
});

test('white balance', () => {
  assert.deepEqual(L.kelvinToRgb(6600).map(Math.round), [255, 255, 255]);
  const warm = L.kelvinToRgb(3200);
  assert.ok(warm[0] > warm[2], 'tungsten is orange');
  const g = L.wbGains(3200, 3200);
  for (const v of g) assert.ok(Math.abs(v - 1) < 1e-9, 'matched WB is neutral');
  const cast = L.wbGains(3200, 5600);
  assert.ok(cast[0] > 1 && cast[2] < 1, 'tungsten light with daylight WB looks orange');
  // Estimate light from a grey card photographed with the wrong WB
  for (const light of [2700, 3200, 4300, 5600, 7500]) {
    const gains = L.wbGains(light, 5600);
    const est = L.estimateKelvin(gains.map((v) => v * 128), 5600);
    assert.ok(Math.abs(est - light) < 200, `${light} → ${est}`);
  }
});

test('lighting ratios', () => {
  assert.equal(L.keyFillRatio(3, 1), 4);
  assert.equal(L.keyFillRatio(1, 0), Infinity);
  assert.match(L.lookName(2), /High-key/);
  assert.match(L.lookName(4), /Standard/);
  assert.match(L.lookName(8), /Dramatic/);
  assert.match(L.lookName(16), /Noir/);
});

test('DCT round trip and compression', () => {
  const blk = Float64Array.from({ length: 64 }, (_, i) => ((i * 37) % 255) - 128);
  const back = L.idct8(L.dct8(blk));
  for (let i = 0; i < 64; i++) assert.ok(Math.abs(back[i] - blk[i]) < 1e-6);
  const flat = new Float64Array(64).fill(50);
  const co = L.dct8(flat);
  assert.ok(Math.abs(co[0] - 400) < 1e-6, 'flat block has only DC');
  for (let i = 1; i < 64; i++) assert.ok(Math.abs(co[i]) < 1e-9);
  assert.equal(L.quantMatrix(50)[0], 16);
  assert.ok(L.quantMatrix(10)[0] > L.quantMatrix(90)[0]);
  const w = 32, h = 16, src = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { src[i * 4] = (i * 13) % 256; src[i * 4 + 1] = (i * 7) % 256; src[i * 4 + 2] = (i * 3) % 256; src[i * 4 + 3] = 255; }
  const hi = L.compressImage(src, w, h, { quality: 95, subsampling: '444' });
  const lo = L.compressImage(src, w, h, { quality: 5, subsampling: '420' });
  assert.ok(hi.psnr > lo.psnr, 'higher quality = higher PSNR');
  assert.ok(hi.nonzero > lo.nonzero, 'higher quality = more data');
  assert.equal(hi.data.length, src.length);
});

test('trim tools respect handles and sequence length', () => {
  const clips = [{ id: 'A', in: 10, out: 60, len: 100 }, { id: 'B', in: 20, out: 70, len: 100 }, { id: 'C', in: 0, out: 50, len: 80 }];
  const len0 = L.seqLength(clips);
  let r = L.ripple(clips, 1, 'end', -12);
  assert.equal(r.clips[1].out, 58); assert.equal(L.seqLength(r.clips), len0 - 12);
  r = L.ripple(clips, 1, 'end', 500); assert.equal(r.applied, 30, 'limited by source length');
  r = L.ripple(clips, 0, 'start', -50); assert.equal(r.applied, -10, 'limited by source start');
  r = L.roll(clips, 0, 8); assert.equal(L.seqLength(r.clips), len0); assert.equal(r.clips[0].out, 68); assert.equal(r.clips[1].in, 28);
  r = L.roll(clips, 0, -100); assert.equal(r.clips[1].in, 0, 'limited by B source start'); assert.equal(L.seqLength(r.clips), len0);
  r = L.roll([{ in: 0, out: 5, len: 9 }, { in: 50, out: 60, len: 90 }], 0, -100); assert.equal(r.clips[0].out - r.clips[0].in, 1, 'never below 1 frame');
  r = L.slip(clips, 1, 10); assert.deepEqual([r.clips[1].in, r.clips[1].out], [30, 80]); assert.equal(L.seqLength(r.clips), len0);
  r = L.slip(clips, 2, 999); assert.equal(r.clips[2].out, 80);
  r = L.slide(clips, 1, -6); assert.equal(r.applied, 0, 'blocked: next clip has no frames before its in-point');
  const c2 = clips.map((c) => ({ ...c })); c2[2].in = 10;
  r = L.slide(c2, 1, -6); assert.equal(L.seqLength(r.clips), L.seqLength(c2)); assert.equal(r.clips[0].out, 54); assert.equal(r.clips[2].in, 4);
  r = L.slide(clips, 1, 6); assert.equal(r.clips[2].in, 6); assert.equal(L.timelineStart(r.clips, 1), 56);
  assert.equal(L.slide(clips, 0, 5).applied, 0, 'first clip cannot slide');
  assert.deepEqual(clips[0], { id: 'A', in: 10, out: 60, len: 100 }, 'input not mutated');
});

const sine = (f, amp, sec, fs) => Float64Array.from({ length: Math.round(sec * fs) }, (_, i) => amp * Math.sin((2 * Math.PI * f * i) / fs));
test('BS.1770 loudness reference values', () => {
  const [s1, s2] = L.kCoeffs(48000); // ITU-R BS.1770-4 table values
  [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585].forEach((v, i) => assert.ok(Math.abs(s1[i] - v) < 1e-6, `s1[${i}]`));
  [1, -2, 1, -1.99004745483398, 0.99007225036621].forEach((v, i) => assert.ok(Math.abs(s2[i] - v) < 1e-6, `s2[${i}]`));
  for (const fs of [48000, 44100]) {
    const m = L.measureLoudness([sine(997, 1, 3, fs)], fs);
    assert.ok(Math.abs(m.integrated - -3.01) < 0.05, `mono full-scale 997 Hz @${fs}: ${m.integrated}`);
    const s = sine(997, 0.1, 3, fs);
    const st = L.measureLoudness([s, s], fs);
    assert.ok(Math.abs(st.integrated - -20) < 0.1, `stereo −20 dBFS: ${st.integrated}`);
    assert.ok(Math.abs(st.samplePeakDb - -20) < 0.05);
  }
  const silent = L.measureLoudness([new Float64Array(48000 * 2)], 48000);
  assert.equal(silent.integrated, -Infinity);
  const short = L.measureLoudness([new Float64Array(100)], 48000);
  assert.equal(short.integrated, -Infinity);
  const adv = L.gainAdvice({ integrated: -20, samplePeakDb: -3 }, L.LOUDNESS_TARGETS[0]);
  assert.equal(adv.gain, 6); assert.equal(adv.needsLimiter, true);
});

test('export specs and ffmpeg commands', () => {
  for (const id of Object.keys(L.PLATFORMS)) {
    const s = L.exportSpec(id, { fps: 24 });
    const cmd = L.ffmpegCommand(s, 'My Edit v2.mov');
    assert.match(cmd, /^ffmpeg -i My_Edit_v2\.mov /);
    assert.ok(!/[;&|`$]/.test(cmd), 'no shell metacharacters');
  }
  assert.match(L.ffmpegCommand(L.exportSpec('youtube', { fps: 24 })), /loudnorm=I=-14:TP=-1/);
  assert.match(L.ffmpegCommand(L.exportSpec('shorts', { fps: 30 })), /scale=1080:1920/);
  assert.match(L.ffmpegCommand(L.exportSpec('master', { fps: 25, srcW: 3840, srcH: 2160 })), /prores_ks.*scale=3840:2160/);
  assert.match(L.ffmpegCommand(L.exportSpec('youtube'), '$(rm -rf ~).mov'), /ffmpeg -i __rm_-rf___\.mov/);
  assert.throws(() => L.exportSpec('nope'));
});

test('captions: chunking, timing, SRT/VTT round trip', () => {
  assert.equal(L.srtTime(3661.5), '01:01:01,500');
  assert.equal(L.srtTime(0.0004, '.'), '00:00:00.000');
  const text = 'Welcome to HYPERCUT. Today we learn the J-cut and the L-cut, the fastest way to make dialogue feel natural. Let us begin.';
  const caps = L.buildCaptions(text, { duration: 12, maxChars: 32, maxLines: 2 });
  assert.ok(caps.length >= 3);
  for (const c of caps) { assert.ok(c.lines.length <= 2); for (const l of c.lines) assert.ok(l.length <= 32, l); }
  assert.ok(Math.abs(caps.at(-1).end - 12) < 1e-9);
  assert.equal(caps.map((c) => c.lines.join(' ')).join(' '), text);
  const srt = L.toSRT(caps);
  const back = L.parseSRT(srt);
  assert.deepEqual(back.errors, []);
  assert.equal(back.caps.length, caps.length);
  assert.ok(L.toVTT(caps).startsWith('WEBVTT'));
  const fast = L.buildCaptions(text, { duration: 2 });
  assert.ok(fast.some((c) => c.warn));
  assert.deepEqual(L.buildCaptions('   ', { duration: 5 }), []);
  assert.throws(() => L.buildCaptions('hi', { duration: 0 }));
  const bad = L.parseSRT('1\n00:00:02,000 --> 00:00:01,000\nHi\n\n2\nnonsense\nYo\n\n3\n00:00:00,500 --> 00:00:03,000\nOverlap');
  assert.equal(bad.errors.length, 3);
});

test('rates, quotes and CSV safety', () => {
  const r = L.rateCalc({ income: 60000, expenses: 6000, weeksOff: 6, daysPerWeek: 5, utilization: 0.5, taxRate: 0.25 });
  assert.equal(r.billableDays, 115);
  assert.ok(Math.abs(r.dayRate - (80000 + 6000) / 115) < 1e-6);
  const q = L.projectQuote({ type: 'youtube', minutes: 10, dayRate: 400 });
  assert.equal(q.hours, 12); assert.equal(q.price, 600);
  assert.ok(L.projectQuote({ type: 'youtube', minutes: 10, dayRate: 400, revisions: 4, color: true }).price > q.price);
  assert.throws(() => L.projectQuote({ type: 'x', minutes: 1, dayRate: 1 }));
  assert.equal(L.csvCell('=HYPERLINK("http://evil")'), `"'=HYPERLINK(""http://evil"")"`);
  assert.equal(L.csvCell('+1'), "'+1");
  assert.equal(L.csvCell('a,b'), '"a,b"');
  assert.equal(L.toCSV([['Shot', 'Size'], ['1', 'CU']]), 'Shot,Size\r\n1,CU');
});
