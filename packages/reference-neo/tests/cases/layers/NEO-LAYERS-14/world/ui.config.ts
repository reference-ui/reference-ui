// Config for the NEO-LAYERS-14 world. It takes the canonical valid spelling, a standalone
// build with no upstreams, and emits the published system the cycle upstream extends. The
// spec rewrites this file once per bad relation, runs the spawned bin, and restores this
// exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers14',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
