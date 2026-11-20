import { loadProgress, recordQuiz, toggleProject, QUIZ_PASS } from '../core/progress.js';
import { toast, safeJson } from './_shared.js';

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

async function paint() {
  const p = await loadProgress();
  document.querySelectorAll('.lesson-list li[data-lesson]').forEach((li) => li.classList.toggle('done', has(p.lessons, li.dataset.lesson)));
  const pb = document.querySelector('[data-project-toggle]');
  if (pb) {
    const on = has(p.projects, pb.dataset.projectToggle);
    pb.classList.toggle('is-on', on);
    pb.textContent = on ? '✓ Project complete' : 'Mark project complete';
    pb.setAttribute('aria-pressed', String(on));
  }
  const form = document.getElementById('quiz-form');
  const q = form && p.quizzes[form.dataset.week];
  if (q) {
    const r = form.querySelector('.quiz-result');
    if (!r.textContent) r.textContent = `Your best: ${q.best}/${q.total}${q.best / q.total >= QUIZ_PASS ? ' (passed ✓)' : ''}`;
  }
}

document.querySelector('[data-project-toggle]')?.addEventListener('click', async (e) => {
  try {
    const on = await toggleProject(e.currentTarget.dataset.projectToggle);
    if (on) toast('+250 XP. Project complete! 🏗️', 'xp');
    await paint();
  } catch (err) { toast(err.message || 'Could not save.', 'err'); }
});

const form = document.getElementById('quiz-form');
const data = safeJson(document.getElementById('quiz-data'));
if (form && data && Array.isArray(data.questions)) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let score = 0, unanswered = 0;
    data.questions.forEach((q, i) => {
      const fs = form.querySelector(`fieldset[data-q="${i}"]`);
      const picked = form.querySelector(`input[name="q${i}"]:checked`);
      fs.classList.remove('correct', 'wrong');
      fs.querySelectorAll('.opt').forEach((o) => o.classList.remove('is-answer'));
      const why = fs.querySelector('.why');
      if (!picked) { unanswered++; why.hidden = true; return; }
      const ok = Number(picked.value) === q.answer;
      if (ok) score++;
      fs.classList.add(ok ? 'correct' : 'wrong');
      fs.querySelectorAll('.opt')[q.answer]?.classList.add('is-answer');
      why.hidden = false;
      why.textContent = (ok ? '✓ Correct. ' : '✗ Not quite. ') + q.why;
    });
    const result = form.querySelector('.quiz-result');
    if (unanswered) { result.textContent = `Answer all questions first (${unanswered} left).`; return; }
    const total = data.questions.length;
    const passed = score / total >= QUIZ_PASS;
    result.textContent = `You scored ${score}/${total} (${Math.round((score / total) * 100)}%). ${passed ? 'Passed! 🎉' : 'You need 80% to pass. Review the lessons and try again.'}`;
    try {
      const r = await recordQuiz(String(data.week), score, total);
      if (r.improved) toast(`New best: ${score}/${total}${passed ? ' (+100 XP pass bonus)' : ''}`, 'xp');
    } catch (err) { toast(err.message || 'Could not save score.', 'err'); }
  });
  form.addEventListener('reset', () => {
    form.querySelectorAll('fieldset').forEach((fs) => { fs.classList.remove('correct', 'wrong'); fs.querySelector('.why').hidden = true; fs.querySelectorAll('.opt').forEach((o) => o.classList.remove('is-answer')); });
    form.querySelector('.quiz-result').textContent = '';
  });
}

paint().catch(() => {});
