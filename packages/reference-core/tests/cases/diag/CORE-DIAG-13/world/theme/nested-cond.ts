// Minimal fixture for ATM-W-UNSUPPORTED-GLOBAL-VALUE in the CORE-DIAG-13
// world. It takes the author globalCss() collector and nests a responsive
// array under a body color. Compiling the world must surface the code as a
// warning with a non-blank message.
import { globalCss } from '@reference-ui/core'

globalCss({ body: { color: { sm: ['red'] } } })
