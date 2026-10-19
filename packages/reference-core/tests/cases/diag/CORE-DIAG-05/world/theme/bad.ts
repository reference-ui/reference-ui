// Minimal fixture for ATM-E-UNKNOWN-TOKEN in the CORE-DIAG-05 world. It
// takes the generated css runtime and emits one class referencing the
// missing `{colors.nope}` token. Compiling the world must surface the code
// as an error with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ color: '{colors.nope}' })
