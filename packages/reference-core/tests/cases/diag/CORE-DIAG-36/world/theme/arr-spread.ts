// Minimal fixture for ATM-W-RESPONSIVE-ARRAY-SPREAD in the CORE-DIAG-36
// world. It takes the generated css runtime and spreads an opaque binding
// into a padding array. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

declare const dyn: string

export const refused = css({ padding: ['8px', ...dyn, '12px'] })
