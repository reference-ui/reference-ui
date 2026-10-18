// Config for the NEO-LAYERS-13 world. It takes the sync defaults and emits a standalone build
// with no upstreams. The spec rewrites this file to extend the ext upstream and layer the lay
// upstream, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers13',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
