/**
 * Toast direction resolution: an explicit rtl/ltr prop wins, auto and
 * undefined read document.dir, and SSR without a document falls back
 * to ltr. The stack and swipe defaults derive edge directions from
 * this single reading so RTL mirrors without directional overrides.
 */
export function resolveDir(dir?: 'rtl' | 'ltr' | 'auto'): 'ltr' | 'rtl' {
  if (dir === 'rtl' || dir === 'ltr') return dir
  if (typeof document === 'undefined') return 'ltr'
  return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'
}
