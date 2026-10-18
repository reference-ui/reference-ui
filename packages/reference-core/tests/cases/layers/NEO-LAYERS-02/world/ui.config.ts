// Config for the NEO-LAYERS-02 world. It takes the sync defaults and emits a standalone
// build with no upstreams. The spec rewrites this file between its two phases to list
// the up upstream under layers and then under extends, and restores this exact spelling
// in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers2',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
