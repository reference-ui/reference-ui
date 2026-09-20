// Enterprise harvest fixture: gap negative control. gap is a record-time
// filtered owned prop, so this dynamic site warns but must NOT appear in
// the sink census.
import { css } from '@reference-ui/react'

export function gapControl(gap: string) { return css({ gap }) }
