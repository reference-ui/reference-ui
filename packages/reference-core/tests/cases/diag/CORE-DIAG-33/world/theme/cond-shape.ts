// Minimal fixture for ATM-W-NON-OBJECT-CONDITION in the CORE-DIAG-33
// world. It takes the generated css runtime and emits one class whose
// `_hover` value is a bare string. Compiling the world must surface the code
// as a warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ _hover: 'red' })
