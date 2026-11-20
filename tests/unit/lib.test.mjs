import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fpsById, framesToTC, parseTC, framesPerBeat, beatFrames, bpmFromTaps, lensCalc, SENSORS, CODECS, RESOLUTIONS, estimateBitrate, storageCalc,
  hslToRgb, rgbToHex, hexToRgb, rgbToHsl, harmony, cubicBezier, EASE_PRESETS, keyAlpha, suppressSpill, applyGrade, buildGradeLUT, LOOK_PRESETS,
} from '../../src/assets/js/labs/lib.js';

test('non-drop timecode round trips', () => {
  for (const id of ['23.976', '24', '25', '29.97', '30', '50', '59.94', '60']) {
    const r = fpsById(id);
    for (const f of [0, 1, 23, 24, 1439, 86399, 123456, 2_000_000]) assert.equal(parseTC(framesToTC(f, r), r), f, `${id} @ ${f}`);
  }
  assert.equal(framesToTC(24 * 3600, fpsById('24')), '01:00:00:00');
  assert.equal(framesToTC(25, fpsById('25')), '00:00:01:00');
});

test('29.97 drop-frame known values', () => {
  const r = fpsById('29.97df');
  assert.equal(framesToTC(1799, r), '00:00:59;29');
  assert.equal(framesToTC(1800, r), '00:01:00;02');
  assert.equal(framesToTC(17982, r), '00:10:00;00');
  assert.equal(framesToTC(107892, r), '01:00:00;00'); // 1 hour of 29.97 DF
  assert.equal(parseTC('00:01:00;02', r), 1800);
  assert.equal(parseTC('01:00:00;00', r), 107892);
  assert.throws(() => parseTC('00:01:00;00', r), /does not exist/);
  assert.throws(() => parseTC('00:01:00;01', r), /does not exist/);
  assert.doesNotThrow(() => parseTC('00:10:00;00', r));
  for (let f = 0; f < 40000; f += 7) assert.equal(parseTC(framesToTC(f, r), r), f);
});

test('59.94 drop-frame drops 4 labels', () => {
  const r = fpsById('59.94df');
  assert.equal(framesToTC(3600, r), '00:01:00;04');
  assert.equal(framesToTC(35964, r), '00:10:00;00');
  for (let f = 0; f < 80000; f += 13) assert.equal(parseTC(framesToTC(f, r), r), f);
});

test('timecode parser rejects bad input', () => {
  const r = fpsById('25');
  for (const bad of ['', 'abc', '00:60:00:00', '00:00:60:00', '00:00:00:25', '1:2:3', '<script>', '00:00:00:00:00']) assert.throws(() => parseTC(bad, r));
  assert.equal(parseTC('-00:00:01:00', r), -25);
  assert.throws(() => framesToTC(NaN, r));
});

test('beat math', () => {
  assert.equal(framesPerBeat(120, 24), 12);
  assert.equal(framesPerBeat(100, 30), 18);
  assert.deepEqual(beatFrames(120, 24, 4), [0, 12, 24, 36]);
  const f = beatFrames(128, 24, 129); // 11.25 frames/beat: no cumulative drift
  assert.equal(f[128], Math.round(128 * 11.25));
  assert.throws(() => framesPerBeat(0, 24));
  assert.equal(bpmFromTaps([0, 500, 1000, 1500, 2000]), 120);
  assert.equal(bpmFromTaps([0]), null);
  assert.equal(bpmFromTaps([0, 10, 20]), null); // too fast = ignored
});

test('lens and depth of field', () => {
  const r = lensCalc({ sensor: SENSORS[0], focal: 50, aperture: 2.8, distance: 3 });
  assert.ok(Math.abs(r.hyperfocal - 29.81) < 0.05, `H=${r.hyperfocal}`);
  assert.ok(Math.abs(r.near - 2.73) < 0.02, `near=${r.near}`);
  assert.ok(Math.abs(r.far - 3.33) < 0.02, `far=${r.far}`);
  assert.ok(Math.abs(r.hfov - 39.6) < 0.1);
  assert.equal(Math.round(r.crop * 100) / 100, 1);
  const far = lensCalc({ sensor: SENSORS[0], focal: 24, aperture: 8, distance: 50 });
  assert.equal(far.far, Infinity);
  const mft = lensCalc({ sensor: SENSORS.find((s) => s.id === 'mft'), focal: 25, aperture: 1.4, distance: 2 });
  assert.ok(Math.abs(mft.crop - 2) < 0.05);
  assert.throws(() => lensCalc({ sensor: SENSORS[0], focal: 50, aperture: 2.8, distance: 0 }));
  assert.throws(() => lensCalc({ sensor: SENSORS[0], focal: 50, aperture: 2.8, distance: 0.04 }));
});

test('bitrate and storage', () => {
  const hq = CODECS.find((c) => c.id === 'prores-hq');
  const uhd = RESOLUTIONS.find((r) => r.id === 'uhd');
  assert.ok(Math.abs(estimateBitrate(hq, uhd, 29.97) - 880) < 1);
  const s = storageCalc({ mbps: 100, seconds: 3600, streams: 1, audioTracks: 0 });
  assert.equal(s.GB, 45);
  assert.equal(s.MBps, 12.5);
  assert.throws(() => storageCalc({ mbps: -1, seconds: 1 }));
});

test('color conversions and harmonies', () => {
  assert.deepEqual(hslToRgb(0, 1, 0.5), [255, 0, 0]);
  assert.deepEqual(hslToRgb(120, 1, 0.5), [0, 255, 0]);
  assert.equal(rgbToHex([255, 128, 0]), '#ff8000');
  assert.deepEqual(hexToRgb('#FF8000'), [255, 128, 0]);
  assert.equal(hexToRgb('nope'), null);
  assert.equal(hexToRgb('#ff800'), null);
  const [h] = rgbToHsl(255, 128, 0);
  assert.ok(Math.abs(h - 30) < 0.5);
  assert.deepEqual(harmony('complementary', 0, 1, 0.5), ['#ff0000', '#00ffff']);
  assert.equal(harmony('triadic', 0, 1, 0.5).length, 3);
  assert.equal(harmony('unknown-type', 0, 1, 0.5).length, 2);
});

test('cubic bezier easing', () => {
  const lin = cubicBezier(...EASE_PRESETS.linear);
  for (const x of [0, 0.1, 0.5, 0.9, 1]) assert.ok(Math.abs(lin(x) - x) < 1e-4);
  const e = cubicBezier(...EASE_PRESETS['ease-out']);
  assert.equal(e(0), 0); assert.equal(e(1), 1);
  assert.ok(e(0.5) > 0.5, 'ease-out is ahead of linear at midpoint');
  const back = cubicBezier(...EASE_PRESETS['back-out']);
  const peak = Math.max(...Array.from({ length: 101 }, (_, i) => back(i / 100)));
  assert.ok(peak > 1, 'back-out overshoots');
  // CSS "ease" at 0.5 ≈ 0.8024
  assert.ok(Math.abs(cubicBezier(...EASE_PRESETS.ease)(0.5) - 0.8024) < 0.002);
});

test('chroma key and spill', () => {
  const key = [34, 197, 82];
  assert.equal(keyAlpha(34, 197, 82, key, 0.1, 0.05), 0);
  assert.equal(keyAlpha(220, 160, 130, key, 0.1, 0.05), 1);
  const mid = keyAlpha(80, 170, 90, key, 0.05, 0.3);
  assert.ok(mid > 0 && mid < 1);
  assert.equal(suppressSpill(100, 200, 100, 1), 100);
  assert.equal(suppressSpill(100, 200, 100, 0), 200);
  assert.equal(suppressSpill(200, 100, 100, 1), 100); // non-green untouched
});

test('neutral grade is identity; presets stay in range', () => {
  const w = 16, h = 16;
  const src = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < src.length; i++) src[i] = (i * 37) % 256;
  for (let i = 3; i < src.length; i += 4) src[i] = 255;
  const out = new Uint8ClampedArray(src.length);
  applyGrade(src, out, w, h, { pivot: 0.435 }, buildGradeLUT({}));
  for (let i = 0; i < src.length; i++) assert.ok(Math.abs(out[i] - src[i]) <= 1, `px ${i}: ${src[i]} → ${out[i]}`);
  for (const [k, v] of Object.entries(LOOK_PRESETS)) {
    applyGrade(src, out, w, h, v.p);
    assert.ok(out.every((x) => x >= 0 && x <= 255), k);
  }
});
