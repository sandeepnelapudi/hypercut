// Small WebCrypto helpers (work in browsers and Node 20+).
const subtle = () => {
  const s = globalThis.crypto && globalThis.crypto.subtle;
  if (!s) throw new Error('Secure crypto is unavailable. Use HTTPS or localhost.');
  return s;
};
const enc = new TextEncoder();

export function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export function fromHex(hex) {
  if (typeof hex !== 'string' || !/^([0-9a-f]{2})*$/i.test(hex)) throw new Error('bad hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
export function randomHex(bytes = 32) {
  const a = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(a);
  return toHex(a);
}
export async function sha256Hex(str) {
  return toHex(await subtle().digest('SHA-256', enc.encode(String(str))));
}
export async function pbkdf2Hex(password, saltHex, iterations) {
  const key = await subtle().importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations }, key, 256);
  return toHex(bits);
}
// Constant-time comparison of two equal-format hex strings.
export function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
