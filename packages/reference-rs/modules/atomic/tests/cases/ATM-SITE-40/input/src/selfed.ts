import { css } from '@reference-ui/react'
import { spin } from './self'

// Self re-export: the first hop re-enters its own pair, the guard yields
// no origin, and the use warns with its sibling kept.
export const a = css({ color: spin, padding: '24px' })
