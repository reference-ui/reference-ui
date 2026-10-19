// Companion global for the CORE-DIAG-07 world. It takes the author
// globalCss() collector and emits a plain body color rule with no container
// root. The responsive `r` utility in cq.ts then triggers
// ATM-W-MISSING-CONTAINER-ROOT when the world compiles.
import { globalCss } from '@reference-ui/core'

globalCss({ body: { color: 'red' } })
