// Config for the CORE-LAYERS-18 world. It takes the canonical valid spelling, a standalone build with no
// upstreams, and emits the published system the legs rewrite. The spec rewrites this file once per leg,
// runs the spawned bin or an in-process sync, and restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers18',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
