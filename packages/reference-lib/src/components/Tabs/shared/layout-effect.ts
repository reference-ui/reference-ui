/**
 * Isomorphic layout effect: layout before paint in the browser (atomic
 * ARIA linkage and pre-paint registration), plain effect on the server
 * where layout effects warn and never run. Every Tabs subscription uses
 * this so SSR markup and the first client commit stay identical.
 */
import * as React from 'react'

// Layout before paint in the browser (atomic ARIA linkage, TB-DOM-06),
// plain effect on the server where layout effects warn and never run.
export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect
