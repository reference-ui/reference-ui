// Config for the CORE-LAYERS-15 world. It takes the sync defaults and emits a standalone
// build with no upstreams. The spec rewrites this file to list the lc upstream under layers
// by a relative import, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers15',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
