import { css } from '@reference-ui/react'
import { cond, fb, partial } from './barrel'

// Spread and member reads through the barrel, including the partial
// conditional: the residue flag rides the binding walk to the origin.
export const barrelSpread = css({ ...cond })
export const barrelFallback = css({ ...fb })
export const barrelPartial = css({ ...partial })
export const barrelPartialMember = css({ color: partial.color })
