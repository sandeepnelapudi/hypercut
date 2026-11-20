import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { freshDB } from './_setup.mjs';
import * as auth from '../../src/assets/js/core/auth.js';
import { safeParse, assertName, LocalStorageAdapter } from '../../src/assets/js/core/db.js';
import { timingSafeEqualHex, sha256Hex } from '../../src/assets/js/core/crypto.js';

let db;
beforeEach(() => { db = freshDB(); });
const good = { name: 'Ada Editor', email: 'Ada@Example.com', password: 'Montage2026!' };

test('register creates user, hashes password, starts session', async () => {
  const u = await auth.register(good);
  assert.equal(u.email, 'ada@example.com');
  assert.equal(u.name, 'Ada Editor');
  assert.ok(!('hash' in u) && !('salt' in u), 'public user must not expose secrets');
  const stored = await db.get('users', u.id);
  assert.notEqual(stored.hash, good.password);
  assert.match(stored.hash, /^[0-9a-f]{64}$/);
  assert.match(stored.salt, /^[0-9a-f]{32}$/);
  // Raw storage never contains the plaintext password
  for (const [, v] of globalThis.localStorage.m) assert.ok(!v.includes(good.password));
  assert.deepEqual(await auth.currentUser({ fresh: true }), u);
});

test('duplicate email (case-insensitive) is rejected', async () => {
  await auth.register(good);
  await assert.rejects(auth.register({ ...good, email: ' ADA@example.COM ' }), { code: 'exists' });
});

test('login/logout and generic error messages', async () => {
  await auth.register(good);
  await auth.logout();
  assert.equal(await auth.currentUser({ fresh: true }), null);
  const e1 = await auth.login({ email: good.email, password: 'wrongPass1' }).catch((e) => e);
  const e2 = await auth.login({ email: 'nobody@example.com', password: 'wrongPass1' }).catch((e) => e);
  assert.equal(e1.message, e2.message, 'no user enumeration');
  const u = await auth.login({ email: 'ada@EXAMPLE.com', password: good.password });
  assert.equal(u.email, 'ada@example.com');
  assert.ok(await auth.currentUser({ fresh: true }));
});

test('session token is stored hashed; tampered token rejected', async () => {
  await auth.register(good);
  const token = globalThis.localStorage.getItem('hc:v1~session');
  assert.match(token, /^[0-9a-f]{64}$/);
  const keys = await db.keys('sessions');
  assert.equal(keys.length, 1);
  assert.notEqual(keys[0], token);
  globalThis.localStorage.setItem('hc:v1~session', 'f'.repeat(64));
  assert.equal(await auth.currentUser({ fresh: true }), null);
  globalThis.localStorage.setItem('hc:v1~session', '<img src=x onerror=alert(1)>');
  assert.equal(await auth.currentUser({ fresh: true }), null);
});

test('expired session is rejected and cleaned up', async () => {
  await auth.register(good);
  const [k] = await db.keys('sessions');
  const s = await db.get('sessions', k);
  s.expires = Date.now() - 1;
  await db.put('sessions', k, s);
  assert.equal(await auth.currentUser({ fresh: true }), null);
  assert.equal((await db.keys('sessions')).length, 0);
});

test('throttling after repeated failures', async () => {
  await auth.register(good);
  await auth.logout();
  for (let i = 0; i < 5; i++) await assert.rejects(auth.login({ email: good.email, password: 'nopeNope1' }), { code: 'invalid_credentials' });
  await assert.rejects(auth.login({ email: good.email, password: good.password }), { code: 'throttled' });
});

test('logoutAll and changePassword revoke other sessions', async () => {
  await auth.register(good);
  const oldToken = globalThis.localStorage.getItem('hc:v1~session');
  await auth.logoutAll();
  const newToken = globalThis.localStorage.getItem('hc:v1~session');
  assert.notEqual(oldToken, newToken);
  globalThis.localStorage.setItem('hc:v1~session', oldToken);
  assert.equal(await auth.currentUser({ fresh: true }), null, 'old session invalid');
  globalThis.localStorage.setItem('hc:v1~session', newToken);
  assert.ok(await auth.currentUser({ fresh: true }));
  await assert.rejects(auth.changePassword('wrong-pass1', 'NewPass2027'), { code: 'invalid_credentials' });
  await assert.rejects(auth.changePassword(good.password, 'short'), { code: 'invalid' });
  await assert.rejects(auth.changePassword(good.password, good.password), { code: 'invalid' });
  await auth.changePassword(good.password, 'NewPass2027');
  await auth.logout();
  await assert.rejects(auth.login({ email: good.email, password: good.password }));
  assert.ok(await auth.login({ email: good.email, password: 'NewPass2027' }));
});

test('deleteAccount removes all user data', async () => {
  const u = await auth.register(good);
  await db.put('progress', u.id, { lessons: {} });
  await assert.rejects(auth.deleteAccount('bad-pass1'));
  await auth.deleteAccount(good.password);
  assert.equal(await db.get('users', u.id), null);
  assert.equal(await db.get('progress', u.id), null);
  assert.equal((await db.keys('sessions')).length, 0);
  assert.equal(await auth.currentUser({ fresh: true }), null);
  // email can be reused after deletion
  assert.ok(await auth.register(good));
});

test('validation rules', () => {
  assert.equal(auth.validateEmail('a@b.co'), null);
  for (const bad of ['', 'a', 'a@b', '@b.co', 'a b@c.co', 'a@b..co', '<x>@y.co', 'a@-b.co', 'x'.repeat(250) + '@b.co']) assert.ok(auth.validateEmail(bad), bad);
  assert.ok(auth.validatePassword('short1'));
  assert.ok(auth.validatePassword('allletters'));
  assert.ok(auth.validatePassword('12345678'));
  assert.ok(auth.validatePassword('password123'));
  assert.ok(auth.validatePassword('x1'.repeat(70)));
  assert.ok(auth.validatePassword('adalovelace9', { email: 'adalovelace@x.com' }));
  assert.equal(auth.validatePassword('Montage2026!'), null);
  assert.ok(auth.validateName(''));
  assert.ok(auth.validateName('<script>alert(1)</script>'));
  assert.ok(auth.validateName('a'.repeat(61)));
  assert.ok(auth.validateName('bad\u0000name'));
  assert.equal(auth.validateName("Zoë O'Neil-Smith"), null);
  assert.equal(auth.passwordStrength(''), 0);
  assert.equal(auth.passwordStrength('Abcdefgh1234!'), 4);
});

test('XSS-style names are rejected at registration', async () => {
  await assert.rejects(auth.register({ ...good, name: '<img src=x onerror=alert(1)>' }), { code: 'invalid' });
});

test('safeNext prevents open redirects', () => {
  assert.equal(auth.safeNext('/lesson/01-x/'), '/lesson/01-x/');
  for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', '/%0d%0a', 'evil.com', null, '/login/', '/\u0000x', 'x'.repeat(400)]) {
    assert.equal(auth.safeNext(bad), '/dashboard/', String(bad));
  }
});

test('storage layer: key validation, prototype pollution, corrupt data', async () => {
  assert.throws(() => assertName('id', '__proto__'));
  assert.throws(() => assertName('id', 'a:b'));
  assert.throws(() => assertName('id', '../x'));
  assert.throws(() => assertName('id', ''));
  const polluted = safeParse('{"__proto__":{"admin":true},"a":{"constructor":{"prototype":{"x":1}}}}');
  assert.equal(({}).admin, undefined);
  assert.equal(polluted.admin, undefined);
  assert.equal(safeParse('{not json'), null);
  globalThis.localStorage.setItem('hc:v1:users:ux', '{corrupt');
  assert.equal(await db.get('users', 'ux'), null);
  // Quota errors are surfaced as friendly StorageError
  const full = new LocalStorageAdapter({ getItem() { return null; }, setItem() { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; }, removeItem() {}, key() { return null; }, length: 0 });
  await assert.rejects(full.put('progress', 'u1', {}), { code: 'quota' });
});

test('crypto helpers', async () => {
  assert.equal(timingSafeEqualHex('abcd', 'abcd'), true);
  assert.equal(timingSafeEqualHex('abcd', 'abce'), false);
  assert.equal(timingSafeEqualHex('abcd', 'abcdef'), false);
  assert.equal(timingSafeEqualHex(null, 'a'), false);
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(auth.PBKDF2_ITERATIONS, 600000);
});
