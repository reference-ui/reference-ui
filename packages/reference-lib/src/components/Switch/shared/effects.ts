/**
 * Layout before paint in the browser (pre-paint default-thumb
 * reconciliation), plain effect on the server where layout effects warn.
 * Reads the document once at module load — bundlers ship one branch per
 * environment, and the choice never flips mid-session.
 */
import * as React from 'react'

export const useIsomorphicLayoutEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect
