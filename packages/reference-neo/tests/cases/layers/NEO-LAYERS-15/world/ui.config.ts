// Config for the NEO-LAYERS-15 world. It takes the sync defaults and emits a standalone
// build with no upstreams. The spec rewrites this file to list the lc upstream under layers
// by a relative import, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers15',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
