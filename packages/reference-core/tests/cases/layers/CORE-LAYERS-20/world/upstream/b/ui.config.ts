// Config for the CORE-LAYERS-20 middle package, b. It takes its token fragment and its component source with no
// upstreams: the spec rewrites this file mid-run to extend a's published base system, syncs it, and restores this
// exact spelling in a finally. Its bound `react.mjs` renders b's Card, which stamps `data-layer="core-layers20-b"`.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers20-b',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
