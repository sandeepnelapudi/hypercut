import { currentUser } from '../core/auth.js';
import { loadProgress, computeStats, loadCourseMap } from '../core/progress.js';
import { h, clear, fmtDate } from '../core/ui.js';
import { sha256Hex } from '../core/crypto.js';

const root = document.getElementById('cert-root');

function drawCert(ctx, name, date, code, lessons = 60, weeks = 12) {
  const W = 1600, H = 1131;
  ctx.canvas.width = W; ctx.canvas.height = H;
  ctx.fillStyle = '#0b0b12'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#ff3d7f'); g.addColorStop(.5, '#a55cff'); g.addColorStop(1, '#00e0ff');
  ctx.strokeStyle = g; ctx.lineWidth = 14; ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2; ctx.strokeRect(70, 70, W - 140, H - 140);
  // film strip edges
  ctx.fillStyle = '#1d1d2e';
  for (let x = 110; x < W - 110; x += 46) { ctx.fillRect(x, 92, 26, 16); ctx.fillRect(x, H - 108, 26, 16); }
  ctx.textAlign = 'center';
  ctx.fillStyle = g; ctx.font = '900 64px system-ui, sans-serif'; ctx.fillText('HYPERCUT', W / 2, 220);
  ctx.fillStyle = '#a3a3bd'; ctx.font = '600 26px system-ui, sans-serif'; ctx.fillText('EDIT GOD MODE · 90-DAY VIDEO EDITING PROGRAM', W / 2, 270);
  ctx.fillStyle = '#ececf4'; ctx.font = '500 34px Georgia, serif'; ctx.fillText('This certifies that', W / 2, 390);
  let size = 96;
  ctx.font = `800 ${size}px Georgia, serif`;
  while (ctx.measureText(name).width > W - 300 && size > 40) { size -= 4; ctx.font = `800 ${size}px Georgia, serif`; }
  ctx.fillStyle = '#ffffff'; ctx.fillText(name, W / 2, 510);
  ctx.fillStyle = g; ctx.fillRect(W / 2 - 300, 545, 600, 4);
  ctx.fillStyle = '#ececf4'; ctx.font = '500 32px Georgia, serif';
  ctx.fillText(`has completed all ${lessons} lessons and passed all ${weeks} assessments in`, W / 2, 630);
  ctx.fillText('cinematography, editing theory, color science and grading, sound design,', W / 2, 675);
  ctx.fillText('motion graphics, VFX, trending effects, AI workflows and professional delivery.', W / 2, 720);
  ctx.font = '700 30px system-ui, sans-serif'; ctx.fillStyle = '#ffd23f'; ctx.fillText('★ CERTIFIED HYPERCUT EDITOR ★', W / 2, 820);
  ctx.font = '500 24px system-ui, sans-serif'; ctx.fillStyle = '#a3a3bd';
  ctx.fillText(`Awarded ${date}`, W / 2, 900);
  ctx.font = '500 20px ui-monospace, monospace'; ctx.fillText(`Certificate ID: ${code}`, W / 2, 940);
}

async function render() {
  const u = await currentUser({ fresh: true });
  if (!u) { location.replace('/login/?next=' + encodeURIComponent('/certificate/')); return; }
  const [map, p] = await Promise.all([loadCourseMap(), loadProgress()]);
  const s = computeStats(p, map);
  if (!s.certified) {
    clear(root).append(h('section', { class: 'narrow card center' }, h('h2', {}, 'Almost there'),
      h('p', { class: 'lead' }, `Complete all lessons (${s.lessons}/${s.totalLessons}) and pass all quizzes (${s.quizzesPassed}/${s.totalWeeks}) to unlock your certificate.`),
      h('a', { class: 'btn', href: '/dashboard/' }, 'Back to dashboard')));
    return;
  }
  const finished = Math.max(...Object.values(p.lessons), ...Object.values(p.quizzes).map((q) => q.at));
  const code = 'HC-' + (await sha256Hex(`${u.id}|${finished}`)).slice(0, 12).toUpperCase();
  const canvas = h('canvas', { role: 'img', 'aria-label': `HYPERCUT certificate for ${u.name}` });
  drawCert(canvas.getContext('2d'), u.name, fmtDate(finished), code, s.totalLessons, s.totalWeeks);
  const dl = h('button', { class: 'btn btn-lg', type: 'button' }, 'Download PNG');
  dl.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `HYPERCUT-certificate-${code}.png`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  });
  const h1 = document.getElementById('page-h1');
  if (h1) h1.textContent = 'Congratulations 🏆';
  clear(root).append(h('div', { class: 'cert-canvas-wrap' }, canvas), h('p', { class: 'center' }, dl));
}
render().catch(() => clear(root).append(h('p', { class: 'form-error' }, 'Could not load certificate.')));
