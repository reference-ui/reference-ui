import { css } from '@reference-ui/react'
import { loop } from './cycle-a'

// Re-export cycle beside the conditional shapes: the guard yields no
// origin, so the spread warns and the static sibling survives.
export const cycled = css({ ...loop, padding: '4px' })
