// Minimal fixture for ATM-W-UNKNOWN-TOKEN-PATH in the CORE-DIAG-04 world.
// It takes the generated css runtime and emits one class pointing caretColor
// at the missing `ui.missing.path`. Compiling the world must surface the
// code as a warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ caretColor: 'ui.missing.path' })
