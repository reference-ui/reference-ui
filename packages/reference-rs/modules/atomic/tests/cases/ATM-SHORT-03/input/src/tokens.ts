import { css, token } from '@reference-ui/react'

// Token kinds behind the scalar gate: `token('none')` on `outline` passes
// through whole (no ring), the red path agrees as the control.
export const none = css({ outline: token('none', '#000') })
export const path = css({ outline: token('colors.red.500', '#000') })
