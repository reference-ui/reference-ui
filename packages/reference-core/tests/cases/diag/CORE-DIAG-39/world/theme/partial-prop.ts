// Minimal fixture for ATM-W-PARTIAL-OBJECT-PROP in the CORE-DIAG-39 world.
// It takes the generated css runtime and spreads a half-static object — one
// static leaf beside one call result — into css(). Compiling the world must
// surface the code as a warning with a non-blank message.
import { css } from '@reference-ui/react'

declare const flag: boolean
declare const run: () => string

const part = { color: flag ? 'white' : run() }
export const spread = css({ ...part })
