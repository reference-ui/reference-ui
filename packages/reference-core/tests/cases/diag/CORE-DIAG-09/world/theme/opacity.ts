// Minimal fixture for ATM-W-MALFORMED-OPACITY in the CORE-DIAG-09 world.
// It takes the generated css runtime and emits one class whose color trails
// a dangling opacity slash. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ color: 'red.500/' })
