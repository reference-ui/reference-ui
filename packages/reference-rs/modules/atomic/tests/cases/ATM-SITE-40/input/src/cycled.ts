import { css } from '@reference-ui/react'
import { loop } from './cycle-a'

// Re-export cycle: the guard yields no origin, so the spread warns and
// the sibling survives. `loop` is declared nowhere, so the merge-bag
// fallback genuinely misses and the guard stays observable.
export const a = css({ ...loop, padding: '16px' })
