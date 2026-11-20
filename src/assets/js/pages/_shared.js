export { toast, h, clear } from '../core/ui.js';

// Parse a <script type="application/json"> block safely.
export function safeJson(el) {
  if (!el) return null;
  try { return JSON.parse(el.textContent, (k, v) => (k === '__proto__' || k === 'constructor' ? undefined : v)); } catch { return null; }
}

export function qs(name) {
  try { return new URLSearchParams(location.search).get(name); } catch { return null; }
}
