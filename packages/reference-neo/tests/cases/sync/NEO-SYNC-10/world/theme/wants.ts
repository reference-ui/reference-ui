// Theme wants for the NEO-SYNC-10 world. It takes the upstream tokens
// through extends and emits the utility classes plus the card recipe the
// probe page paints, with a call carrying the recipe emission signal.
import { css, recipe } from '@reference-ui/react'

export const upCls = css({ color: 'up' })
export const sharedCls = css({ color: 'shared' })
export const card = recipe({ className: 'card', base: { color: 'up' } })

// Emission signal: the probe page carries the closed base class by hand.
card()
