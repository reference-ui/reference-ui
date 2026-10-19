// Minimal fixture for ATM-W-UNREALIZABLE-EXTENSION in the CORE-DIAG-22
// world. It takes the generated css runtime and emits one class using the
// translateX extension. Compiling the world must surface the code as a
// warning with a non-blank message.
import { css } from '@reference-ui/react'

export const cls = css({ translateX: '10px' })
