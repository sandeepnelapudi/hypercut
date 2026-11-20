import { initLab, h, select, clear, toast } from './_lab.js';

// Default shortcuts (Windows notation; on macOS "Ctrl" = Cmd, "Alt" = Option). Versions and custom layouts can differ.
export const SETS = {
  premiere: { name: 'Adobe Premiere Pro', keys: [
    ['Razor tool', 'C'], ['Selection tool', 'V'], ['Ripple Edit tool', 'B'], ['Rolling Edit tool', 'N'], ['Slip tool', 'Y'], ['Slide tool', 'U'],
    ['Track Select Forward tool', 'A'], ['Pen tool', 'P'], ['Hand tool', 'H'], ['Type tool', 'T'], ['Add Edit (cut at playhead)', 'Ctrl+K'],
    ['Ripple trim previous edit to playhead', 'Q'], ['Ripple trim next edit to playhead', 'W'], ['Mark In', 'I'], ['Mark Out', 'O'], ['Insert edit', ','],
    ['Overwrite edit', '.'], ['Add marker', 'M'], ['Match frame', 'F'], ['Toggle snapping', 'S'], ['Play / stop', 'Space'], ['Shuttle left', 'J'],
    ['Stop (shuttle)', 'K'], ['Shuttle right', 'L'], ['Go to next edit point', 'ArrowDown'], ['Go to previous edit point', 'ArrowUp'], ['Undo', 'Ctrl+Z'],
    ['Zoom in timeline', '='], ['Zoom out timeline', '-'], ['Zoom to fit sequence', '\\'],
  ] },
  resolve: { name: 'DaVinci Resolve (Edit page)', keys: [
    ['Selection mode', 'A'], ['Trim edit mode', 'T'], ['Blade edit mode', 'B'], ['Split clip at playhead', 'Ctrl+B'], ['Mark In', 'I'], ['Mark Out', 'O'],
    ['Insert clip', 'F9'], ['Overwrite clip', 'F10'], ['Replace clip', 'F11'], ['Place on top', 'F12'], ['Add marker', 'M'], ['Toggle snapping', 'N'],
    ['Play / stop', 'Space'], ['Play reverse', 'J'], ['Stop', 'K'], ['Play forward', 'L'], ['Next edit', 'ArrowDown'], ['Previous edit', 'ArrowUp'],
    ['Undo', 'Ctrl+Z'], ['Toggle linked selection', 'Ctrl+Shift+L'], ['Zoom to fit timeline', 'Shift+Z'], ['Dynamic trim mode', 'W'],
  ] },
  fcp: { name: 'Final Cut Pro (Mac: Ctrl = Cmd)', keys: [
    ['Select tool', 'A'], ['Trim tool', 'T'], ['Position tool', 'P'], ['Range Selection tool', 'R'], ['Blade tool', 'B'], ['Blade at playhead', 'Ctrl+B'],
    ['Mark In', 'I'], ['Mark Out', 'O'], ['Connect to primary storyline', 'Q'], ['Insert', 'W'], ['Append to storyline', 'E'], ['Overwrite', 'D'],
    ['Add marker', 'M'], ['Toggle snapping', 'N'], ['Toggle skimming', 'S'], ['Play / stop', 'Space'], ['Next edit', 'ArrowDown'], ['Previous edit', 'ArrowUp'],
    ['Undo', 'Ctrl+Z'], ['Zoom to fit', 'Shift+Z'], ['Trim start to playhead', 'Alt+['], ['Trim end to playhead', 'Alt+]'],
  ] },
};

// Normalise a KeyboardEvent into "Ctrl+Shift+K" form. Meta (Cmd) counts as Ctrl.
export function comboFromEvent(e) {
  const k = e.key;
  if (['Control', 'Shift', 'Alt', 'Meta', 'OS'].includes(k)) return null;
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  let key = k === ' ' ? 'Space' : k.length === 1 ? k.toUpperCase() : k;
  // With Alt on macOS, e.key may produce special characters; fall back to physical key code.
  if (e.altKey && e.code) { if (e.code === 'BracketLeft') key = '['; else if (e.code === 'BracketRight') key = ']'; else if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3); }
  if (e.shiftKey && (key.length > 1 || /[A-Z]/.test(key)) && key !== 'Space') parts.push('Shift');
  else if (e.shiftKey && key === 'Space') parts.push('Shift');
  parts.push(key);
  return parts.join('+');
}

const root = initLab('shortcut-trainer');
if (root) {
  let set = 'premiere', queue = [], idx = 0, score = 0, start = 0, active = false, revealed = false;
  const prompt = h('div', { class: 'key-display', role: 'status', 'aria-live': 'polite', tabindex: '0' }, 'Choose an app and press Start.');
  const feedback = h('p', { class: 'center' });
  const prog = h('p', { class: 'muted center' });
  const ref = h('details', { class: 'card' });

  function buildRef() {
    clear(ref).append(h('summary', {}, `Reference: ${SETS[set].name}`), h('table', {}, h('tbody', {}, SETS[set].keys.map(([a, k]) => h('tr', {}, h('td', {}, a), h('td', {}, h('kbd', {}, k)))))));
  }
  function next() {
    revealed = false;
    if (idx >= queue.length) {
      active = false;
      const secs = ((performance.now() - start) / 1000).toFixed(1);
      prompt.textContent = `Done! ${score}/${queue.length} in ${secs}s`;
      feedback.textContent = score === queue.length ? '🔥 Perfect. You have editor hands.' : 'Run it again until it\'s 15/15.';
      startBtn.textContent = 'Play again';
      if (score === queue.length) toast('Perfect run! ⌨️', 'xp');
      return;
    }
    prompt.textContent = queue[idx][0];
    prog.textContent = `Question ${idx + 1}/${queue.length} · Score ${score}`;
  }
  function onKey(e) {
    if (!active) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const combo = comboFromEvent(e);
    if (!combo) return;
    if (combo === 'Tab' || combo === 'Escape') { if (combo === 'Escape') { active = false; prompt.textContent = 'Stopped.'; } return; }
    e.preventDefault();
    const want = queue[idx][1];
    if (combo === want) { if (!revealed) score++; feedback.textContent = `✓ ${want}`; idx++; next(); }
    else feedback.textContent = `✗ You pressed ${combo}. Try again, or use "Show answer".`;
  }
  document.addEventListener('keydown', onKey);
  const appSel = select({ label: 'App', value: set, options: Object.entries(SETS).map(([k, v]) => [k, v.name]), onChange: (v) => { set = v; buildRef(); active = false; prompt.textContent = 'Press Start.'; } });
  const startBtn = h('button', { class: 'btn', type: 'button' }, 'Start (15 questions)');
  startBtn.addEventListener('click', () => {
    queue = SETS[set].keys.slice().sort(() => Math.random() - 0.5).slice(0, 15);
    idx = 0; score = 0; start = performance.now(); active = true; feedback.textContent = ''; startBtn.textContent = 'Restart';
    startBtn.blur(); prompt.focus(); next();
  });
  const show = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Show answer');
  show.addEventListener('click', () => { if (!active) return; revealed = true; feedback.textContent = `Answer: ${queue[idx][1]}. Press it to continue (no point awarded).`; prompt.focus(); });
  root.append(h('div', { class: 'ctl-row' }, appSel.row, startBtn, show), prompt, feedback, prog, ref,
    h('p', { class: 'muted small' }, 'Some browser shortcuts (like Ctrl+W or Ctrl+T) cannot be captured, so they are not used here. Press Escape to stop.'));
  buildRef();
}
