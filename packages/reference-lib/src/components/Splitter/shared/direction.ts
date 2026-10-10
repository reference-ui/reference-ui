/**
 * Inherited direction for the group: the nearest [dir] ancestor wins,
 * falling back to the document. Read fresh at each use so mid-focus
 * switches apply at once.
 */

export type SplitterDirection = 'ltr' | 'rtl'

// Inherited direction for the group: nearest [dir] ancestor wins, falling back
// to the document. Read fresh at each use so mid-focus switches apply at once.
export function readDirection(element: HTMLElement | null): SplitterDirection {
  const scoped = element?.closest?.('[dir]')?.getAttribute('dir')?.toLowerCase()
  if (scoped === 'rtl' || scoped === 'ltr') return scoped
  if (typeof document !== 'undefined' && document.dir?.toLowerCase() === 'rtl') return 'rtl'
  return 'ltr'
}
