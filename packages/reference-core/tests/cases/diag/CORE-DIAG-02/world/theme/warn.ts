// Minimal fixture for ATM-W-INVALID-CSS-VALUE in the CORE-DIAG-02 world.
// It takes the generated css runtime and emits one class with a boolean
// display value. Compiling the world must surface the code as a warning
// with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ display: true })
