import { css } from '@reference-ui/react'
import { spreadButton } from './tokens'

export const j = css({ color: glow })
export const k = css({ color: shifted })

// SPEC-V2-34 cross-file (R3b): the imported object carries its spread —
// whole-object and spread uses both fold color and padding, zero diagnostics.
export const sp1 = css(spreadButton)
export const sp2 = css({ ...spreadButton })
