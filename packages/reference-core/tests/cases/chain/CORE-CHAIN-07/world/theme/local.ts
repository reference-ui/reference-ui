// Local fragment for the CORE-CHAIN-07 world. It takes the core fragment
// collector and emits only the body ink: no author `:root`, so the standalone
// phase proves the baked default applies. The spec rewrites this file mid-run
// to add a `:root` override, then restores this exact spelling in a finally.
import { globalCss } from '@reference-ui/core'

globalCss({
  body: { color: '#111111' },
})
