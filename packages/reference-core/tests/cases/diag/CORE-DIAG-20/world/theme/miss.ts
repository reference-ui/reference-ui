// Minimal fixture for ATM-W-MISSING-STYLE-PLAN in the CORE-DIAG-20 world.
// It takes the generated css runtime and emits one class referencing the
// missing `{colors.nope}` token. Compiling the world must surface the code
// as a warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ color: '{colors.nope}' })
