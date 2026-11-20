import { weeks1to4 } from './weeks-01-04.mjs';
import { weeks5to8 } from './weeks-05-08.mjs';
import { weeks9to12 } from './weeks-09-12.mjs';

export const site = {
  name: 'HYPERCUT',
  fullName: 'HYPERCUT: Edit God Mode',
  tagline: '90 days from first cut to edit god mode.',
  description: 'HYPERCUT: Edit God Mode is a 12-week video editing course from beginner to pro. It covers cinematography, color grading, color theory, sound design, VFX, motion graphics, trending effects, AI tools and how editing engines work, with 14 interactive labs.',
  url: (process.env.SITE_URL || 'https://hypercut.academy').replace(/\/+$/, ''),
  locale: 'en_US',
  twitter: '@hypercutacademy',
  themeColor: '#0b0b12',
};

export const phases = [
  { n: 1, name: 'Foundations', weeks: [1, 2, 3, 4], blurb: 'How video works, the NLE, cinematography and editing theory.' },
  { n: 2, name: 'Craft', weeks: [5, 6, 7, 8], blurb: 'Sound design, color science, grading and motion graphics.' },
  { n: 3, name: 'God Mode', weeks: [9, 10, 11, 12], blurb: 'VFX, trending effects, genre mastery, AI, finishing and career.' },
];

export const weeks = [...weeks1to4, ...weeks5to8, ...weeks9to12];

// Stable lesson IDs used as storage keys: w01-l1 etc.
export function lessonId(weekN, idx) {
  return `w${String(weekN).padStart(2, '0')}-l${idx + 1}`;
}
export function weekPath(w) { return `/week/${String(w.n).padStart(2, '0')}-${w.slug}/`; }
export function lessonPath(w, l) { return `/lesson/${String(w.n).padStart(2, '0')}-${l.slug}/`; }

export const labs = [
  { id: 'color-grading', name: 'Color Grading Studio', icon: '🎨', cat: 'Color', blurb: 'Grade with lift/gamma/gain, temperature, saturation and looks — with a live waveform, RGB parade, vectorscope and histogram. Works on your own images too.' },
  { id: 'color-harmony', name: 'Color Harmony Explorer', icon: '🌈', cat: 'Color', blurb: 'Generate complementary, triadic, analogous and split palettes and see their mood instantly.' },
  { id: 'shutter-fps', name: 'Shutter & Frame Rate Simulator', icon: '🎞️', cat: 'Camera', blurb: 'See how frame rate and shutter angle change motion blur and the feel of motion.' },
  { id: 'dof-lens', name: 'Lens & Depth of Field Calculator', icon: '🔭', cat: 'Camera', blurb: 'Calculate field of view, near/far focus and hyperfocal distance for any sensor and lens.' },
  { id: 'composition', name: 'Composition Grid Analyzer', icon: '📐', cat: 'Camera', blurb: 'Overlay thirds, golden ratio, diagonals and centre guides on your own frames.' },
  { id: 'aspect-safe-zones', name: 'Aspect Ratio & Safe Zones', icon: '📱', cat: 'Delivery', blurb: 'Preview 16:9, 9:16, 4:5, 2.39:1 framing and TikTok/Reels/Shorts UI safe zones.' },
  { id: 'bitrate-calculator', name: 'Bitrate & Storage Calculator', icon: '💾', cat: 'Technical', blurb: 'Estimate file sizes and drive needs for any codec, resolution, frame rate and duration.' },
  { id: 'timecode', name: 'Timecode Calculator', icon: '⏱️', cat: 'Technical', blurb: 'Convert frames ↔ timecode, add durations, and understand drop-frame at 29.97 and 59.94.' },
  { id: 'easing', name: 'Easing Curve Playground', icon: '〰️', cat: 'Motion', blurb: 'Drag bezier handles, preview the motion and copy the cubic-bezier values for any app.' },
  { id: 'beat-sync', name: 'Beat Sync Trainer', icon: '🥁', cat: 'Rhythm', blurb: 'Tap a tempo, hear a metronome, and get exact frames-per-beat for cutting to music.' },
  { id: 'eq-trainer', name: 'EQ Ear Trainer', icon: '🎧', cat: 'Audio', blurb: 'Train your ears to identify boosted frequency bands like a professional mixer.' },
  { id: 'chroma-key', name: 'Chroma Key Lab', icon: '🟩', cat: 'VFX', blurb: 'Pull a green-screen key with tolerance, softness and spill suppression and see the matte.' },
  { id: 'blend-modes', name: 'Blend Mode Explorer', icon: '🧪', cat: 'VFX', blurb: 'See every blend mode in action and learn the math behind them.' },
  { id: 'shortcut-trainer', name: 'Shortcut Speed Trainer', icon: '⌨️', cat: 'Speed', blurb: 'Drill the essential keyboard shortcuts for Premiere Pro, DaVinci Resolve and Final Cut Pro.' },
];

export const faq = [
  ['Who is HYPERCUT for?', 'Complete beginners, self-taught editors with gaps, and working editors who want to go pro in color, sound, VFX and story. No prior experience is required.'],
  ['Which software do I need?', 'Any modern editor. Lessons give steps for DaVinci Resolve (free) and Premiere Pro, with notes for Final Cut Pro and CapCut. If you have no software yet, start with DaVinci Resolve. It is free and covers editing, color, VFX and audio.'],
  ['How much time does it take?', 'About 60–90 minutes a day for 90 days. The built-in 90-day planner tells you exactly what to do each day.'],
  ['Do I need an expensive computer?', 'No. Week 1 teaches proxy workflows so you can edit even heavy 4K footage on modest hardware.'],
  ['Is there a certificate?', 'Yes. Complete every lesson and pass every weekly quiz to unlock a downloadable HYPERCUT certificate on your dashboard.'],
  ['Does it cover trending effects and AI?', 'Yes. Week 10 covers trending short-form edits, transitions and effects. Week 12 covers AI tools and how they work, with an ethics guide. The Effects Cookbook has 21 step-by-step recipes.'],
  ['Is my progress saved?', 'Yes. Create a free account and your progress, notes, quiz scores, streaks and badges are saved. They currently live in your browser\'s storage on this device.'],
];
