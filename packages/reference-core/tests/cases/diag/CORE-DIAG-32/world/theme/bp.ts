// Minimal fixture for ATM-W-UNKNOWN-BREAKPOINT in the CORE-DIAG-32 world.
// It takes the generated css runtime and emits one class under the unknown
// `wat` breakpoint. Compiling the world must surface the code as a warning
// with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ r: { wat: { p: '1r' } } })
