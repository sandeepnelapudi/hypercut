import { loadProgress, reviewCard } from '../core/progress.js';
import { h, clear, toast } from '../core/ui.js';

const root = document.getElementById('fc-root');
let cards = [];
let queue = [];
let current = null;
let flipped = false;
let mode = 'term'; // or 'definition' (reverse)

function buildQueue(p) {
  const now = Date.now();
  const due = cards.filter((c) => !p.cards[c.id] || p.cards[c.id].due <= now);
  // New cards first by box (lowest box = weakest), then shuffle within.
  return due.map((c) => ({ c, box: p.cards[c.id]?.box || 0, r: Math.random() })).sort((a, b) => a.box - b.box || a.r - b.r).map((x) => x.c);
}

async function render() {
  const p = await loadProgress();
  if (!queue.length) queue = buildQueue(p);
  const boxes = [1, 2, 3, 4, 5].map((b) => Object.values(p.cards).filter((c) => c.box === b).length);
  const unseen = cards.length - Object.keys(p.cards).length;
  current = queue[0] || null;
  flipped = false;
  const stats = h('div', { class: 'boxes', 'aria-label': 'Leitner boxes' }, h('span', {}, `New: ${unseen}`), boxes.map((n, i) => h('span', {}, `Box ${i + 1}: ${n}`)), h('span', {}, `Due now: ${queue.length}`));
  const modeSel = h('select', { id: 'fc-mode', 'aria-label': 'Card direction' }, h('option', { value: 'term' }, 'Show term → recall definition'), h('option', { value: 'definition' }, 'Show definition → recall term'));
  modeSel.value = mode;
  modeSel.addEventListener('change', () => { mode = modeSel.value; render(); });
  if (!current) {
    clear(root).append(stats, h('div', { class: 'card center' }, h('h2', {}, 'All caught up! 🎉'), h('p', { class: 'muted' }, 'No cards are due. Come back tomorrow, as spaced repetition works best with gaps.'),
      h('button', { class: 'btn', type: 'button', on: { click: () => { queue = cards.slice().sort(() => Math.random() - 0.5); render(); } } }, 'Practise all anyway')));
    return;
  }
  const front = mode === 'term' ? current.t : current.d;
  const back = mode === 'term' ? current.d : current.t;
  const inner = h('div', { class: 'fc-inner', tabindex: '0', role: 'button', 'aria-label': 'Flashcard. Press space to flip.' },
    h('div', { class: 'fc-face front' }, front), h('div', { class: 'fc-face back', 'aria-hidden': 'true' }, back));
  const flip = () => { flipped = !flipped; inner.classList.toggle('flipped', flipped); inner.querySelector('.back').setAttribute('aria-hidden', String(!flipped)); inner.querySelector('.front').setAttribute('aria-hidden', String(flipped)); answers.hidden = !flipped; };
  inner.addEventListener('click', flip);
  const grade = async (knew) => {
    try { const c = await reviewCard(current.id, knew); queue.shift(); if (!knew) queue.splice(Math.min(queue.length, 3), 0, current); toast(knew ? `Box ${c.box} ✓` : 'Back to box 1. You will see it again soon.', knew ? 'xp' : 'ok', 1400); render(); } catch (e) { toast(e.message, 'err'); }
  };
  const answers = h('div', { class: 'fc-actions', hidden: true },
    h('button', { class: 'btn btn-ghost', type: 'button', on: { click: () => grade(false) } }, '✗ Didn\'t know (1)'),
    h('button', { class: 'btn', type: 'button', on: { click: () => grade(true) } }, '✓ Knew it (2)'));
  clear(root).append(h('div', { class: 'ctl-row' }, modeSel), stats, h('div', { class: 'fc-card' }, inner),
    h('div', { class: 'fc-actions' }, h('button', { class: 'btn btn-ghost', type: 'button', on: { click: flip } }, 'Flip (Space)')), answers,
    h('p', { class: 'muted small center' }, 'Keyboard: Space = flip, 1 = didn\'t know, 2 = knew it'));
  onkey = (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); flip(); } else if (flipped && e.key === '1') grade(false); else if (flipped && e.key === '2') grade(true);
  };
}
let onkey = null;
document.addEventListener('keydown', (e) => onkey && onkey(e));

fetch('/glossary.json', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { cards = Array.isArray(j) ? j.filter((c) => c && typeof c.t === 'string' && typeof c.d === 'string' && /^[a-z0-9-]{1,40}$/.test(c.id)) : []; return render(); })
  .catch(() => root.append(h('p', { class: 'form-error' }, 'Could not load flashcards.')));
