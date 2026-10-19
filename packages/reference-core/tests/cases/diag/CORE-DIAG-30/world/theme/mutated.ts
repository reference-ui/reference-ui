// Minimal fixture for ATM-W-MUTATED-BINDING in the CORE-DIAG-30 world. It
// takes the generated css runtime and feeds css() a binding reassigned after
// declaration. Compiling the world must surface the code as a warning with a
// non-blank message.
import { css } from '@reference-ui/react'

let tint = 'red'
tint = 'blue'
export const tinted = css({ color: tint })
