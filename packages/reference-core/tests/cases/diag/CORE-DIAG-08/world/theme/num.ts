// Minimal fixture for ATM-W-NON-CANONICAL-NUMERIC in the CORE-DIAG-08
// world. It takes the generated css runtime and emits one class whose width
// is the string 'Infinity'. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ width: 'Infinity' as any })
