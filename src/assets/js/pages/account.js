import { currentUser, changePassword, deleteAccount, logoutAll, updateProfile } from '../core/auth.js';
import { loadProgress } from '../core/progress.js';
import { h, clear, toast, fmtDate } from '../core/ui.js';
import { getDB } from '../core/db.js';

const root = document.getElementById('account-root');

async function render() {
  const u = await currentUser({ fresh: true });
  if (!u) { location.replace('/login/?next=' + encodeURIComponent('/account/')); return; }
  const nameInput = h('input', { id: 'acc-name', type: 'text', value: u.name, maxlength: '60', autocomplete: 'name', required: true });
  const err = h('p', { class: 'form-error', role: 'alert' });
  const form = h('form', { class: 'form', novalidate: true },
    h('div', { class: 'field' }, h('label', { for: 'acc-name' }, 'Name'), nameInput),
    h('div', { class: 'field' }, h('label', {}, 'Email'), h('p', { class: 'muted' }, u.email)),
    err, h('button', { class: 'btn', type: 'submit' }, 'Save profile'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.textContent = '';
    try { await updateProfile({ name: nameInput.value }); toast('Profile saved'); } catch (ex) { err.textContent = ex.message; }
  });
  clear(root).append(h('section', { class: 'card' }, h('h2', { class: 'h3' }, 'Profile'), h('p', { class: 'muted small' }, `Member since ${fmtDate(u.createdAt)}`), form));
}

document.getElementById('pw-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget; const err = f.querySelector('.form-error'); err.textContent = '';
  const btn = f.querySelector('button'); btn.disabled = true;
  try {
    await changePassword(f.querySelector('#cur-pw').value, f.querySelector('#new-pw').value);
    f.reset(); toast('Password updated. Other sessions were logged out.');
  } catch (ex) { err.textContent = ex.message; } finally { btn.disabled = false; }
});

document.getElementById('export-data')?.addEventListener('click', async () => {
  const u = await currentUser();
  if (!u) return;
  const shotList = await getDB().get('tools', `shotlist-${u.id}`).catch(() => null);
  const aiPrompts = await getDB().get('tools', `prompts-${u.id}`).catch(() => null);
  const data = { exportedAt: new Date().toISOString(), account: u, progress: await loadProgress(), shotList, aiPrompts };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: '#', download: `hypercut-data-${new Date().toISOString().slice(0, 10)}.json` });
  a.href = url; // blob: URL created locally
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Data exported');
});

document.getElementById('delete-account')?.addEventListener('click', async () => {
  const pw = prompt('This permanently deletes your account, progress and notes. Enter your password to confirm:');
  if (pw == null) return;
  try { await deleteAccount(pw); toast('Account deleted.'); setTimeout(() => location.assign('/'), 600); } catch (ex) { toast(ex.message, 'err'); }
});

document.getElementById('logout-all')?.addEventListener('click', async () => {
  try { await logoutAll(); toast('All other sessions have been logged out.'); } catch (ex) { toast(ex.message, 'err'); }
});

render().catch(() => {});
