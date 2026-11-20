import { loadProgress, setLessonComplete, toggleBookmark, saveNote, NOTE_MAX } from '../core/progress.js';
import { currentUser } from '../core/auth.js';
import { toast, debounce } from '../core/ui.js';

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const article = document.querySelector('[data-lesson-id]');
const id = article?.dataset.lessonId;
const completeBtn = document.querySelector('[data-complete]');
const bookmarkBtn = document.querySelector('[data-bookmark]');
const note = document.querySelector('[data-note]');
const noteStatus = document.querySelector('[data-note-status]');
const noteCount = document.querySelector('[data-note-count]');

function setComplete(on) {
  completeBtn.classList.toggle('is-on', on);
  completeBtn.setAttribute('aria-pressed', String(on));
  completeBtn.textContent = on ? '✓ Completed' : 'Mark complete';
}
function setBookmark(on) {
  bookmarkBtn.classList.toggle('is-on', on);
  bookmarkBtn.setAttribute('aria-pressed', String(on));
  bookmarkBtn.textContent = on ? '★ Bookmarked' : '☆ Bookmark';
}
function markSide(p) {
  document.querySelectorAll('.side-lessons li[data-lesson]').forEach((li) => li.classList.toggle('done', has(p.lessons, li.dataset.lesson)));
}

async function init() {
  if (!id) return;
  const [p, user] = await Promise.all([loadProgress(), currentUser()]);
  setComplete(has(p.lessons, id));
  setBookmark(has(p.bookmarks, id));
  markSide(p);
  if (note) {
    note.value = has(p.notes, id) ? p.notes[id].text : '';
    noteCount.textContent = String(note.value.length);
    if (!user) noteStatus.textContent = 'Saved on this device. Log in to keep notes with your account.';
  }
}

completeBtn?.addEventListener('click', async () => {
  const on = completeBtn.getAttribute('aria-pressed') !== 'true';
  completeBtn.disabled = true;
  try {
    await setLessonComplete(id, on);
    setComplete(on);
    markSide(await loadProgress());
    if (on) {
      toast('+50 XP. Lesson complete! 🎬', 'xp');
      if (!(await currentUser())) toast('Create a free account to keep your progress.', 'ok', 4500);
    }
  } catch (e) { toast(e.message || 'Could not save.', 'err'); } finally { completeBtn.disabled = false; }
});

bookmarkBtn?.addEventListener('click', async () => {
  try { const on = await toggleBookmark(id); setBookmark(on); toast(on ? 'Bookmarked' : 'Bookmark removed'); } catch (e) { toast(e.message || 'Could not save.', 'err'); }
});

if (note) {
  const save = debounce(async () => {
    try { await saveNote(id, note.value); noteStatus.textContent = 'Saved ✓'; } catch (e) { noteStatus.textContent = e.message || 'Could not save note.'; }
  }, 600);
  note.addEventListener('input', () => {
    if (note.value.length > NOTE_MAX) note.value = note.value.slice(0, NOTE_MAX);
    noteCount.textContent = String(note.value.length);
    noteStatus.textContent = 'Saving…';
    save();
  });
}

// Reading progress bar
const bar = document.querySelector('.reading-progress span');
if (bar && article) {
  const onScroll = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - innerHeight;
    const pct = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    bar.style.width = `${Math.round(pct * 100)}%`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

init().catch(() => {});
addEventListener('hc:auth', () => init().catch(() => {}));

// ---------- Lesson video ----------
const video = document.querySelector('.lesson-video video');
if (video) {
  const seek = (t) => {
    const go = () => { video.currentTime = Math.min(t, Math.max(0, (video.duration || t) - 0.1)); video.play().catch(() => {}); };
    if (video.readyState >= 1) go(); else video.addEventListener('loadedmetadata', go, { once: true });
  };
  document.querySelectorAll('.lesson-video [data-seek]').forEach((b) => b.addEventListener('click', () => seek(Number(b.dataset.seek) || 0)));
  // Deep links from search engines' "key moments": ?t=SECONDS
  const t = Number(new URLSearchParams(location.search).get('t'));
  if (Number.isFinite(t) && t > 0 && t < 36000) { video.preload = 'auto'; seek(t); document.getElementById('lesson-video')?.scrollIntoView({ block: 'center' }); }
}
// Privacy-friendly embeds: build the iframe only after the learner presses play.
document.querySelectorAll('.video-facade').forEach((f) => {
  const btn = f.querySelector('.video-play');
  btn?.addEventListener('click', () => {
    const kind = f.dataset.embedKind, id = f.dataset.embedId || '';
    let src = null;
    if (kind === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(id)) src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    if (kind === 'vimeo' && /^\d{6,12}$/.test(id)) src = `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
    if (!src) return;
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = f.dataset.embedTitle || 'Lesson video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.loading = 'lazy';
    f.replaceWith(iframe);
    iframe.focus();
  });
});
