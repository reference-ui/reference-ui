// Minimal fixture for ATM-W-UNFOLDABLE-OBJECT-PROP in the CORE-DIAG-38
// world. It takes the generated css runtime and spreads an object whose
// color comes from an opaque call. Compiling the world must surface the code
// as a warning with a non-blank message.
import { css } from '@reference-ui/react'

declare const pick: () => string

const dyn = { color: pick(), padding: '4px' }
export const spread = css({ ...dyn })
