// Root fragment for the NEO-CHAIN-07 upstream package. It takes the author
// globalCss call and emits an upstream `:root` of `0.5rem`: under the merge
// this author definition must beat the downstream baked default, so the
// extended phase paints the upstream value, never `0.25rem`.

import { globalCss } from '@reference-ui/neo'

globalCss({
  ':root': { '--spacing-root': '0.5rem' },
})
