// Test environment: in-memory localStorage shim + fresh DB per test.
export class MemStorage {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(String(k), String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemStorage(), configurable: true, writable: true });

const { LocalStorageAdapter, setDB } = await import('../../src/assets/js/core/db.js');
const auth = await import('../../src/assets/js/core/auth.js');
auth._setIterationsForTests(1000);

export function freshDB() {
  globalThis.localStorage.clear();
  const db = new LocalStorageAdapter(globalThis.localStorage);
  setDB(db);
  auth._resetCacheForTests();
  return db;
}
