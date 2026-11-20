import { initLab, h, select, missionPanel, clear, copyText, toast, download } from './_lab.js';
import { PROMPT_OPTIONS, buildShotPrompt } from './lib2.js';
import { getDB } from '../core/db.js';
import { currentUser } from '../core/auth.js';

const MAX_SAVED = 100;
const LABELS = { size: 'Shot size', angle: 'Angle', lens: 'Lens', move: 'Camera move', light: 'Lighting', palette: 'Color palette', texture: 'Texture / stock', aspect: 'Aspect ratio' };

const root = initLab('ai-prompt-builder');
if (root) {
  const st = { size: '', angle: '', subject: '', action: '', setting: '', lens: '', move: '', light: '', palette: '', texture: '', mood: '', duration: 5, aspect: '16:9', avoid: '' };
  let saved = [];
  let key = 'prompts-guest';
  const out = h('div');
  const lib = h('div');

  function result() { return buildShotPrompt(st); }
  function update() {
    const r = result();
    const pct = Math.round((r.score / r.max) * 100);
    const bar = h('span'); bar.style.width = `${pct}%`;
    clear(out).append(
      h('div', { class: 'code-out' }, h('pre', {}, h('code', {}, r.prompt))),
      h('p', { class: 'small' }, h('strong', {}, 'Negative prompt / avoid: '), r.negative),
      h('p', { class: 'small' }, `Cinematic detail: ${pct}%`), h('div', { class: 'level-bar', 'aria-hidden': 'true' }, bar),
      r.missing.length ? h('p', { class: 'warn-text' }, `Add: ${r.missing.join(', ')}. Generators drift when these are left open.`) : h('p', { class: 'small' }, '✓ This prompt specifies the shot like a cinematographer would.'),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn btn-sm', type: 'button', on: { click: () => copyText(r.prompt) } }, 'Copy prompt'),
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: savePrompt } }, '＋ Save to my continuity library')));
    missions.check();
  }
  async function persist() { try { await getDB().put('tools', key, { v: 1, items: saved }); } catch (e) { toast(e.message || 'Could not save.', 'err'); } }
  function savePrompt() {
    const r = result();
    if (!st.subject.trim()) { toast('Describe the subject first.', 'err'); return; }
    if (saved.length >= MAX_SAVED) { toast(`Library is full (${MAX_SAVED}).`, 'err'); return; }
    saved.push({ subject: st.subject.slice(0, 160), prompt: r.prompt.slice(0, 2000), negative: r.negative.slice(0, 400), at: Date.now() });
    persist(); renderLib(); missions.check(); toast('Saved to your continuity library');
  }
  function renderLib() {
    clear(lib).append(h('h2', { class: 'h4' }, `My continuity library (${saved.length})`),
      saved.length ? h('ol', { class: 'note-list' }, saved.map((s, i) => h('li', {}, h('div', { class: 'snippet' }, s.prompt),
        h('div', { class: 'row-gap' }, h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => copyText(s.prompt) } }, 'Copy'),
          h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': `Delete prompt ${i + 1}`, on: { click: () => { saved.splice(i, 1); persist(); renderLib(); } } }, 'Delete'))))) : h('p', { class: 'muted small' }, 'Save prompts for every shot of a project. Reusing identical subject and style wording keeps characters and looks consistent across generations.'),
      saved.length ? h('button', { class: 'btn btn-sm btn-ghost', type: 'button', on: { click: () => download('ai-shot-prompts.txt', saved.map((s, i) => `SHOT ${i + 1}\n${s.prompt}\nAVOID: ${s.negative}\n`).join('\n')) } }, 'Export as .txt') : null);
  }
  const sels = Object.keys(LABELS).map((k) => select({ label: LABELS[k], value: st[k], options: PROMPT_OPTIONS[k].map((v) => [v, v || '— choose —']), onChange: (v) => { st[k] = v; update(); } }));
  const text = (k, label, ph, max = 160) => { const el = h('input', { type: 'text', maxlength: String(max), placeholder: ph, 'aria-label': label, id: `ai-${k}` }); el.addEventListener('input', () => { st[k] = el.value; update(); }); return h('div', { class: 'field' }, h('label', { for: `ai-${k}` }, label), el); };
  const dur = h('input', { type: 'number', min: '2', max: '20', value: '5', id: 'ai-dur', 'aria-label': 'Duration in seconds' });
  dur.addEventListener('input', () => { st.duration = Number(dur.value) || 5; update(); });
  const missions = missionPanel([
    { title: 'Speak camera', hint: 'Specify a shot size, a lens and a camera movement.', test: () => !!(st.size && st.lens && st.move) },
    { title: 'Light it like a DP', hint: 'Add lighting with direction or contrast, plus a color palette and a texture or film stock.', test: () => !!(st.light && st.palette && st.texture) },
    { title: 'Build a consistent sequence', hint: 'Save at least 3 prompts that share the exact same subject description: a wide, a medium and a close-up of the same character.', test: () => { const counts = {}; for (const s of saved) counts[s.subject.toLowerCase()] = (counts[s.subject.toLowerCase()] || 0) + 1; return Object.values(counts).some((n) => n >= 3); } },
  ], { heading: 'Missions: prompt like a cinematographer' });
  root.append(
    h('div', { class: 'lab-grid-2' },
      h('div', { class: 'form' }, text('subject', 'Subject', 'e.g. a young chef with a red bandana'), text('action', 'Action', 'e.g. flips vegetables in a flaming pan'), text('setting', 'Setting & time', 'e.g. a busy night-market stall, rain'), text('mood', 'Mood', 'e.g. electric, joyful', 80), text('avoid', 'Also avoid (comma separated)', 'e.g. crowds, cars')),
      h('div', { class: 'lab-controls' }, sels.map((s) => s.row), h('div', { class: 'ctl-row' }, h('label', { for: 'ai-dur' }, 'Duration (s)'), dur))),
    h('h2', { class: 'h4' }, 'Your prompt'), out, missions.el, lib,
    h('p', { class: 'muted small' }, 'Works with any text-to-video or image-to-video generator. For best consistency, generate a keyframe image first and use image-to-video. Only generate real people with their written consent, and disclose synthetic shots where required. See the AI Video Masterclass.'));
  (async () => {
    try {
      const u = await currentUser(); key = `prompts-${u ? u.id : 'guest'}`;
      const d = await getDB().get('tools', key);
      saved = Array.isArray(d?.items) ? d.items.slice(0, MAX_SAVED).filter((x) => x && typeof x.prompt === 'string').map((x) => ({ subject: String(x.subject || '').slice(0, 160), prompt: x.prompt.slice(0, 2000), negative: String(x.negative || '').slice(0, 400), at: Number(x.at) || 0 })) : [];
    } catch { saved = []; }
    renderLib(); update();
  })();
}
