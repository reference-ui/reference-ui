// Minimal fixture for ATM-W-UNKNOWN-CONDITION in the CORE-DIAG-06 world.
// It takes the generated css runtime and emits one class whose `_hovr` key
// misspells a condition. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ _hovr: { color: 'red' } })
