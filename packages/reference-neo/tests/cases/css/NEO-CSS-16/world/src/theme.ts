// Global fragment for the CSS-16 world. It takes the neo fragment collector
// and emits the rhythm root the probes resolve their steps against plus the
// body ink the miss probe inherits, so the miss reads as a resting color
// rather than a browser default.
import { globalCss } from '@reference-ui/neo'

globalCss({
  ':root': { '--spacing-root': '0.25rem' },
  body: { color: '#111111' },
})
