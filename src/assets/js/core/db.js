// Storage layer. Every read/write in the app goes through a "DB adapter" with an
// async API, so replacing localStorage with a real backend later means writing a
// new adapter (e.g. RestAdapter) with the same 4 methods. Nothing else changes.
//
//   get(collection, id)        -> object | null
//   put(collection, id, value) -> void
//   delete(collection, id)     -> void
//   keys(collection)           -> string[]

export class StorageError extends Error {
  constructor(message, code = 'storage') { super(message); this.name = 'StorageError'; this.code = code; }
}

const NAME_RE = /^[A-Za-z0-9_.-]{1,128}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function assertName(kind, value) {
  if (typeof value !== 'string' || !NAME_RE.test(value) || FORBIDDEN_KEYS.has(value)) {
    throw new StorageError(`Invalid ${kind}`, 'invalid_key');
  }
}

// JSON parse that strips prototype-pollution keys and never throws.
export function safeParse(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw, (k, v) => (FORBIDDEN_KEYS.has(k) ? undefined : v));
  } catch {
    return null;
  }
}

class MemoryStorage {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(String(k), String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

function detectStorage() {
  try {
    const s = globalThis.localStorage;
    const probe = '__hc_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return { storage: s, persistent: true };
  } catch {
    return { storage: new MemoryStorage(), persistent: false };
  }
}

export class LocalStorageAdapter {
  constructor(storage, prefix = 'hc:v1:') {
    if (storage) { this.storage = storage; this.persistent = true; }
    else { const d = detectStorage(); this.storage = d.storage; this.persistent = d.persistent; }
    this.prefix = prefix;
  }
  _key(collection, id) {
    assertName('collection', collection);
    assertName('id', id);
    return `${this.prefix}${collection}:${id}`;
  }
  async get(collection, id) {
    let raw;
    try { raw = this.storage.getItem(this._key(collection, id)); } catch (e) { if (e instanceof StorageError) throw e; return null; }
    const v = safeParse(raw);
    return v && typeof v === 'object' ? v : null;
  }
  async put(collection, id, value) {
    const key = this._key(collection, id);
    let json;
    try { json = JSON.stringify(value); } catch { throw new StorageError('Value is not serialisable', 'serialise'); }
    try {
      this.storage.setItem(key, json);
    } catch (e) {
      const quota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      throw new StorageError(quota ? 'Your browser storage is full. Export your data and clear some notes.' : 'Could not save data.', quota ? 'quota' : 'write');
    }
  }
  async delete(collection, id) {
    try { this.storage.removeItem(this._key(collection, id)); } catch (e) { if (e instanceof StorageError) throw e; }
  }
  async keys(collection) {
    assertName('collection', collection);
    const p = `${this.prefix}${collection}:`;
    const out = [];
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const k = this.storage.key(i);
        if (k && k.startsWith(p)) out.push(k.slice(p.length));
      }
    } catch { /* ignore */ }
    return out;
  }
}

let _db = null;
export function getDB() {
  if (!_db) _db = new LocalStorageAdapter();
  return _db;
}
// For tests or to plug in a real backend adapter later.
export function setDB(adapter) { _db = adapter; }
