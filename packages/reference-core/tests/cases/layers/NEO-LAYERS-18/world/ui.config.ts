// Config for the NEO-LAYERS-18 world. It takes the canonical valid spelling, a standalone build with no
// upstreams, and emits the published system the legs rewrite. The spec rewrites this file once per leg,
// runs the spawned bin or an in-process sync, and restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers18',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
