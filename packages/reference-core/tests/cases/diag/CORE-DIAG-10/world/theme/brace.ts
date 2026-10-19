// Minimal fixture for ATM-W-UNTERMINATED-BRACE in the CORE-DIAG-10 world.
// It takes the generated css runtime and emits one class whose content
// string opens a brace it never closes. Compiling the world must surface
// the code as a warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ content: '"{oops"' })
