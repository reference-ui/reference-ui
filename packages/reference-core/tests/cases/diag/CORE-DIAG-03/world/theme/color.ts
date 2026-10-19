// Minimal fixture for ATM-W-UNKNOWN-COLOR in the CORE-DIAG-03 world. It
// takes the generated css runtime and emits one class with the unregistered
// `notacolor-xyz` color. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ color: 'notacolor-xyz' })
