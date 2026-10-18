// Tokens for the CORE-CSS-14 world. It takes no inputs and declares the two
// palette colors the dynamic site reads, so the harvest allowlist licenses
// the pooled 'red'/'blue' keywords and the sink mints them onto rules. The
// token names are identifiers and their values dedupe against the palette
// literals, so the pool gains no new values and no static site appears.
import { tokens } from '@reference-ui/core'

tokens({
  colors: {
    red: { value: 'red' },
    blue: { value: 'blue' },
  },
})
