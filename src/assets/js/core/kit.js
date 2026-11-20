// Shared by the build (src/content/toolkit.mjs) and the browser (toolkit page).
// t: { tier, price, focus: string[] }
export function inKit(t, budget, focus) {
  if (budget === 'zero' && t.price !== 'free' && !(t.price === 'freemium' && t.tier === 'essential')) return false;
  if (budget === 'starter' && t.tier === 'pro') return false;
  if (t.tier === 'essential') return true;
  return focus === 'all' ? t.focus.includes('all') : t.focus.includes(focus) || t.focus.includes('all');
}
