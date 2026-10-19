// Minimal fixture for ATM-W-DYNAMIC-BINARY in the CORE-DIAG-29 world. It
// takes the generated css runtime and emits one class whose order is the
// `1 / 0` binary expression. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ order: 1 / 0 })
