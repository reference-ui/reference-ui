// theme.ts — global fragment for the CORE-PRIM-15 world. Takes the core
// fragment collector and emits the rhythm root the pair probes resolve
// their 2r steps against. Without it the corner calc has no basis.
import { globalCss } from '@reference-ui/core'

globalCss({ ':root': { '--spacing-root': '0.25rem' } })
