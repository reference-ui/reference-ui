// Minimal fixture for ATM-W-EMPTY-AT-RULE in the CORE-DIAG-12 world. It
// takes the author globalCss() collector and emits a bare `@supports` with
// no prelude. Compiling the world must surface the code as a warning with a
// non-blank message.
import { globalCss } from '@reference-ui/core'

globalCss({ '@supports': { body: { color: 'gray' } } })
