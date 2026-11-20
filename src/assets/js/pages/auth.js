import { register, login, currentUser, validateEmail, validatePassword, validateName, passwordStrength, safeNext } from '../core/auth.js';
import { migrateGuestTo } from '../core/progress.js';
import { toast, qs } from './_shared.js';

const signup = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const form = signup || loginForm;
const err = form?.querySelector('.form-error');
const next = safeNext(qs('next'));

(async () => {
  if (await currentUser().catch(() => null)) location.replace(next);
})();

function showError(msg, field) {
  err.textContent = msg;
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  if (field) { const el = form.querySelector(`#${field}`); el?.setAttribute('aria-invalid', 'true'); el?.focus(); }
}

const pw = form?.querySelector('#password');
const meter = form?.querySelector('.pw-meter span');
if (pw && meter) {
  pw.addEventListener('input', () => {
    const s = passwordStrength(pw.value);
    meter.style.width = `${(s / 4) * 100}%`;
    meter.style.background = ['#ff5263', '#ff5263', '#ffb020', '#3ddc97', '#3ddc97'][s];
  });
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  const email = form.email.value;
  const password = form.password.value;
  err.textContent = '';
  if (signup) {
    const name = form.name.value;
    const v = validateName(name);
    if (v) return showError(v, 'name');
    const ve = validateEmail(email);
    if (ve) return showError(ve, 'email');
    const vp = validatePassword(password, { email, name });
    if (vp) return showError(vp, 'password');
    if (!form.terms.checked) return showError('Please accept the terms to continue.', 'terms');
  } else if (validateEmail(email) || !password) {
    return showError('Enter your email and password.', validateEmail(email) ? 'email' : 'password');
  }
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = signup ? 'Creating account…' : 'Logging in…';
  try {
    const user = signup
      ? await register({ name: form.name.value, email, password, terms: true })
      : await login({ email, password, remember: !!form.remember?.checked });
    await migrateGuestTo(user.id).catch(() => {});
    toast(signup ? `Welcome to HYPERCUT, ${user.name.split(' ')[0]}! Your 90-day run starts now.` : `Welcome back, ${user.name.split(' ')[0]}!`);
    setTimeout(() => location.assign(signup ? '/dashboard/' : next), 500);
  } catch (ex) {
    showError(ex.message || 'Something went wrong. Please try again.', ex.code === 'exists' ? 'email' : null);
    btn.disabled = false;
    btn.textContent = label;
  }
});
