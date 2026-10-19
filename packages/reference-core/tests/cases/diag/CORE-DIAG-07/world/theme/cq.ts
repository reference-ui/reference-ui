// Minimal fixture for ATM-W-MISSING-CONTAINER-ROOT in the CORE-DIAG-07
// world. It takes the generated css runtime and emits one class under the
// responsive `md` breakpoint. No container root exists in globalCss, so
// compiling the world must surface the code as a warning with a non-blank
// message.
import { css } from '@reference-ui/react'

export const cls = css({ r: { md: { p: '1r' } } })
