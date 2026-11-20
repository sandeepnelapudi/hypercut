// Authentication over the DB adapter.
// Passwords: PBKDF2-SHA256 (600k iterations, OWASP 2023), 16-byte random salt.
// Sessions: 256-bit random token kept on the device; only its SHA-256 hash is stored.
// IMPORTANT: with a localStorage adapter, everything lives in the user's own browser.
// That protects passwords at rest and separates users who share a browser, but it is
// not server-side security. When you connect a real backend, move these checks there.
import { getDB, StorageError } from './db.js';
import { sha256Hex, pbkdf2Hex, randomHex, timingSafeEqualHex } from './crypto.js';

export const PBKDF2_ITERATIONS = 600000;
let iterations = PBKDF2_ITERATIONS;
export function _setIterationsForTests(n) { iterations = n; }

const SESSION_KEY = 'session';
const SESSION_TTL = 7 * 24 * 3600 * 1000;
const SESSION_TTL_LONG = 30 * 24 * 3600 * 1000;
const MAX_FAILS = 5;

export class AuthError extends Error {
  constructor(message, code) { super(message); this.name = 'AuthError'; this.code = code; }
}

// ---------- validation ----------
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const COMMON = new Set(['password', 'password1', 'password123', '12345678', '123456789', 'qwerty123', 'iloveyou1', 'admin123', 'letmein1', 'welcome1', 'abc12345', 'passw0rd', '1q2w3e4r', 'qwertyuiop1']);

export function normaliseEmail(email) { return String(email ?? '').trim().toLowerCase(); }
export function validateEmail(email) {
  const e = normaliseEmail(email);
  if (!e) return 'Enter your email address.';
  if (e.length > 254 || !EMAIL_RE.test(e)) return 'Enter a valid email address.';
  return null;
}
export function validatePassword(pw, { email = '', name = '' } = {}) {
  if (typeof pw !== 'string' || pw.length === 0) return 'Enter a password.';
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (pw.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must include at least one letter and one number.';
  if (COMMON.has(pw.toLowerCase())) return 'That password is too common. Choose another.';
  const local = normaliseEmail(email).split('@')[0];
  if (local && local.length >= 4 && pw.toLowerCase().includes(local)) return 'Password must not contain your email name.';
  if (name && name.trim().length >= 4 && pw.toLowerCase().includes(name.trim().toLowerCase())) return 'Password must not contain your name.';
  return null;
}
export function validateName(name) {
  const n = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!n) return 'Enter your name.';
  if (n.length > 60) return 'Name must be 60 characters or fewer.';
  // Disallow control characters and angle brackets (defence in depth; rendering uses textContent).
  if (/[\u0000-\u001f\u007f<>]/.test(n)) return 'Name contains characters that are not allowed.';
  return null;
}
export function passwordStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

// ---------- internals ----------
const emailKey = (email) => sha256Hex('email:' + normaliseEmail(email));
const tokenKey = (token) => sha256Hex('session:' + token);
const DUMMY_SALT = '00112233445566778899aabbccddeeff';

function publicUser(u) {
  return u ? { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt } : null;
}
function emit(name, detail) {
  try { globalThis.dispatchEvent?.(new CustomEvent(name, { detail })); } catch { /* non-browser */ }
}
function localGet(key) {
  try { return globalThis.localStorage?.getItem('hc:v1~' + key) ?? null; } catch { return null; }
}
function localSet(key, val) {
  try { if (val === null) globalThis.localStorage?.removeItem('hc:v1~' + key); else globalThis.localStorage?.setItem('hc:v1~' + key, val); } catch { /* ignore */ }
}
// Fallback in-memory session for environments without localStorage.
let memToken = null;
const readToken = () => { const t = localGet(SESSION_KEY) ?? memToken; return typeof t === 'string' && /^[0-9a-f]{64}$/.test(t) ? t : null; };
const writeToken = (t) => { memToken = t; localSet(SESSION_KEY, t); };

async function checkThrottle(ek) {
  const db = getDB();
  const t = await db.get('throttle', ek);
  if (t && typeof t.until === 'number' && t.until > Date.now()) {
    const secs = Math.ceil((t.until - Date.now()) / 1000);
    throw new AuthError(`Too many attempts. Try again in ${secs} second${secs === 1 ? '' : 's'}.`, 'throttled');
  }
  return t || { fails: 0, until: 0 };
}
async function recordFail(ek, t) {
  const fails = (Number(t.fails) || 0) + 1;
  const until = fails >= MAX_FAILS ? Date.now() + Math.min(15 * 60_000, 30_000 * 2 ** (fails - MAX_FAILS)) : 0;
  await getDB().put('throttle', ek, { fails, until });
}

async function createSession(user, remember) {
  const token = randomHex(32);
  const now = Date.now();
  await getDB().put('sessions', await tokenKey(token), { userId: user.id, epoch: user.sessionEpoch || 0, createdAt: now, expires: now + (remember ? SESSION_TTL_LONG : SESSION_TTL) });
  writeToken(token);
  cached = undefined;
  return token;
}

// ---------- public API ----------
export async function register({ name, email, password, terms = true }) {
  const errors = validateName(name) || validateEmail(email) || validatePassword(password, { email, name });
  if (errors) throw new AuthError(errors, 'invalid');
  if (!terms) throw new AuthError('Please accept the terms to continue.', 'terms');
  const db = getDB();
  const ek = await emailKey(email);
  if (await db.get('emails', ek)) throw new AuthError('An account with this email already exists. Try logging in.', 'exists');
  const salt = randomHex(16);
  const hash = await pbkdf2Hex(password, salt, iterations);
  const user = {
    id: 'u' + randomHex(12), name: String(name).replace(/\s+/g, ' ').trim(), email: normaliseEmail(email),
    salt, hash, iterations, createdAt: Date.now(), sessionEpoch: 0,
  };
  await db.put('users', user.id, user);
  await db.put('emails', ek, { userId: user.id });
  await createSession(user, false);
  emit('hc:auth', { user: publicUser(user), action: 'register' });
  return publicUser(user);
}

export async function login({ email, password, remember = false }) {
  const generic = new AuthError('Incorrect email or password.', 'invalid_credentials');
  if (validateEmail(email) || typeof password !== 'string' || !password || password.length > 128) throw generic;
  const db = getDB();
  const ek = await emailKey(email);
  const t = await checkThrottle(ek);
  const idx = await db.get('emails', ek);
  const user = idx && typeof idx.userId === 'string' ? await db.get('users', idx.userId) : null;
  // Always derive a hash so response time does not reveal whether the email exists.
  const hash = await pbkdf2Hex(password, user?.salt || DUMMY_SALT, user?.iterations || iterations);
  if (!user || !timingSafeEqualHex(hash, user.hash)) {
    await recordFail(ek, t);
    throw generic;
  }
  await db.delete('throttle', ek);
  await createSession(user, remember);
  emit('hc:auth', { user: publicUser(user), action: 'login' });
  return publicUser(user);
}

let cached; // undefined = not loaded, null = logged out
export async function currentUser({ fresh = false } = {}) {
  if (cached !== undefined && !fresh) return cached;
  const token = readToken();
  if (!token) return (cached = null);
  const db = getDB();
  const tk = await tokenKey(token);
  const s = await db.get('sessions', tk);
  if (!s || typeof s.expires !== 'number' || s.expires < Date.now()) {
    if (s) await db.delete('sessions', tk);
    writeToken(null);
    return (cached = null);
  }
  const u = typeof s.userId === 'string' ? await db.get('users', s.userId).catch(() => null) : null;
  if (!u || (u.sessionEpoch || 0) !== (s.epoch || 0)) {
    await db.delete('sessions', tk);
    writeToken(null);
    return (cached = null);
  }
  return (cached = publicUser(u));
}

export async function logout() {
  const token = readToken();
  if (token) await getDB().delete('sessions', await tokenKey(token));
  writeToken(null);
  cached = null;
  emit('hc:auth', { user: null, action: 'logout' });
}

async function requireUserRecord() {
  const me = await currentUser({ fresh: true });
  if (!me) throw new AuthError('Please log in again.', 'unauthenticated');
  const u = await getDB().get('users', me.id);
  if (!u) throw new AuthError('Please log in again.', 'unauthenticated');
  return u;
}
async function verifyPassword(u, pw) {
  if (typeof pw !== 'string' || !pw || pw.length > 128) return false;
  return timingSafeEqualHex(await pbkdf2Hex(pw, u.salt, u.iterations || iterations), u.hash);
}

// Invalidates every session (all devices/browsers) for the current user, then starts a new one here.
export async function logoutAll() {
  const u = await requireUserRecord();
  u.sessionEpoch = (u.sessionEpoch || 0) + 1;
  await getDB().put('users', u.id, u);
  await createSession(u, false);
  return true;
}

export async function changePassword(current, next) {
  const u = await requireUserRecord();
  if (!(await verifyPassword(u, current))) throw new AuthError('Your current password is incorrect.', 'invalid_credentials');
  const err = validatePassword(next, { email: u.email, name: u.name });
  if (err) throw new AuthError(err, 'invalid');
  if (current === next) throw new AuthError('Choose a password different from your current one.', 'invalid');
  u.salt = randomHex(16);
  u.iterations = iterations;
  u.hash = await pbkdf2Hex(next, u.salt, u.iterations);
  u.sessionEpoch = (u.sessionEpoch || 0) + 1; // revoke other sessions
  await getDB().put('users', u.id, u);
  await createSession(u, false);
  return true;
}

export async function deleteAccount(password) {
  const u = await requireUserRecord();
  if (!(await verifyPassword(u, password))) throw new AuthError('Password is incorrect.', 'invalid_credentials');
  const db = getDB();
  await db.delete('progress', u.id);
  await db.delete('tools', `shotlist-${u.id}`);
  await db.delete('emails', await emailKey(u.email));
  await db.delete('users', u.id);
  // Remove all sessions for this user
  for (const k of await db.keys('sessions')) {
    const s = await db.get('sessions', k);
    if (s && s.userId === u.id) await db.delete('sessions', k);
  }
  writeToken(null);
  cached = null;
  emit('hc:auth', { user: null, action: 'delete' });
  return true;
}

export async function updateProfile({ name }) {
  const err = validateName(name);
  if (err) throw new AuthError(err, 'invalid');
  const u = await requireUserRecord();
  u.name = String(name).replace(/\s+/g, ' ').trim();
  await getDB().put('users', u.id, u);
  cached = publicUser(u);
  emit('hc:auth', { user: cached, action: 'update' });
  return cached;
}

// Only allow same-origin relative paths as post-login redirects (prevents open redirects).
export function safeNext(raw, fallback = '/dashboard/') {
  if (typeof raw !== 'string' || raw.length > 300) return fallback;
  let decoded;
  try { decoded = decodeURIComponent(raw); } catch { return fallback; }
  for (const v of [raw, decoded]) {
    if (!v.startsWith('/') || v.startsWith('//') || /[\u0000-\u001f\u007f\\]/.test(v)) return fallback;
  }
  if (/^\/(login|signup)\//.test(raw)) return fallback;
  return raw;
}

export function _resetCacheForTests() { cached = undefined; memToken = null; }
export { StorageError };
