// Config for the NEO-LAYERS-08 world. It takes the sync defaults and emits a standalone
// build with no upstreams. The spec rewrites this file to list the up upstream under
// layers, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers8',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
