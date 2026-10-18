// Config for the CORE-LAYERS-11 world, the diamond consumer. It takes the sync defaults and emits a
// standalone build with no upstreams. The spec rewrites this file to extend branch b and layer
// branch c, both of which extend the shared base a, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers11',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
