/** Inherited-direction lookup for the RovingFocus kernel. `getDirection`
 * reads computed `direction` off an item node so horizontal arrows reverse
 * under RTL without remounting. A convergence seam (FEATURES #7): forked
 * engines (Listbox navigation, Tabs arrows) call this instead of keeping a
 * local copy, so every consumer agrees on what RTL means. */

export function getDirection(el: HTMLElement | null): 'ltr' | 'rtl' {
  if (!el || typeof window === 'undefined') return 'ltr'
  return window.getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr'
}
