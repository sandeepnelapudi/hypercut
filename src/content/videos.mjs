// Lesson videos. Add your own AI-made (or camera-made) tutorial videos here.
// Keyed by lesson id: w01-l1 = Week 1, Lesson 1 … w12-l5.
//
// Three kinds are supported:
//   { kind: 'file',    src: '/media/x.mp4', type: 'video/mp4', poster: '/media/x.jpg', captions: '/media/x.en.vtt', ... }
//       optional fallback: { src: '/media/x.webm', type: 'video/webm' } for browsers without H.264 (some Linux Chromium builds)
//       → self-hosted file in src/public/media/ (keep each file small: H.264 1080p, ~5–8 Mbps; under ~30 MB is ideal)
//   { kind: 'youtube', id: 'VIDEO_ID', poster: '/media/x.jpg' (optional local thumbnail), ... }
//   { kind: 'vimeo',   id: '123456789', ... }
//       → privacy-friendly click-to-load embeds (nothing loads from YouTube/Vimeo until the learner presses play)
//
// Required for every video: title, description, duration (ISO 8601, e.g. 'PT2M30S'), uploadDate ('YYYY-MM-DD').
// Optional: chapters: [{ t: seconds, label }], ai: true if the video is AI-generated (shown to learners as a label), credit.

export const lessonVideos = {
  'w01-l1': {
    kind: 'file',
    title: 'Frames, frame rates and the 180° shutter: animated explainer',
    description: 'A 40-second animated explainer: video as still frames, how 12, 24 and 60 fps feel, and how shutter angle controls motion blur.',
    src: '/media/w01-l1-frames-shutter.mp4',
    type: 'video/mp4',
    fallback: { src: '/media/w01-l1-frames-shutter.webm', type: 'video/webm' },
    poster: '/media/w01-l1-frames-shutter.jpg',
    captions: '/media/w01-l1-frames-shutter.en.vtt',
    duration: 'PT40S',
    uploadDate: '2026-11-20',
    ai: false,
    credit: 'Motion-graphics explainer generated with code by HYPERCUT.',
    chapters: [{ t: 0, label: 'Video is still frames' }, { t: 8, label: 'Frame rates compared' }, { t: 20, label: 'Shutter angle & motion blur' }, { t: 32, label: 'The 180° rule' }],
  },
};

const ISO_DUR = /^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/;
const LOCAL = /^\/media\/[A-Za-z0-9._-]+$/;
export function validateVideo(id, v) {
  const errs = [];
  if (!/^w(0[1-9]|1[0-2])-l[1-5]$/.test(id)) errs.push('bad lesson id');
  if (!v || typeof v !== 'object') return ['missing'];
  if (!['file', 'youtube', 'vimeo'].includes(v.kind)) errs.push('kind must be file, youtube or vimeo');
  if (!v.title || !v.description) errs.push('title and description required');
  if (!ISO_DUR.test(v.duration || '') || v.duration === 'PT') errs.push('duration must be ISO 8601 like PT2M30S');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.uploadDate || '')) errs.push('uploadDate must be YYYY-MM-DD');
  if (v.kind === 'file') {
    if (!LOCAL.test(v.src || '')) errs.push('src must be a /media/ file');
    if (!/^video\/(mp4|webm)$/.test(v.type || '')) errs.push('type must be video/mp4 or video/webm');
    if (v.fallback && (!LOCAL.test(v.fallback.src || '') || !/^video\/(mp4|webm)$/.test(v.fallback.type || ''))) errs.push('fallback must be { src: /media/…, type: video/mp4|webm }');
  }
  if (v.kind === 'youtube' && !/^[A-Za-z0-9_-]{11}$/.test(v.id || '')) errs.push('youtube id must be 11 characters');
  if (v.kind === 'vimeo' && !/^\d{6,12}$/.test(v.id || '')) errs.push('vimeo id must be numeric');
  for (const f of ['poster', 'captions']) if (v[f] && !LOCAL.test(v[f])) errs.push(`${f} must be a /media/ file`);
  if (v.chapters && (!Array.isArray(v.chapters) || v.chapters.some((c) => !(c.t >= 0) || !c.label))) errs.push('chapters must be [{t, label}]');
  return errs;
}
export function isoToSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}
