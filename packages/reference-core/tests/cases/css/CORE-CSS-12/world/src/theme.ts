// Global fragment for the CSS-12 world. It takes the core fragment collector
// and emits the rhythm root the probes resolve their steps against.
import { globalCss } from '@reference-ui/core'

globalCss({ ':root': { '--spacing-root': '0.25rem' } })
