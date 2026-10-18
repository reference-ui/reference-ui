// Config for the CORE-LAYERS-03 world. It takes the sync defaults and emits a standalone
// build with no upstreams. The spec rewrites this file once per layer variant to extend
// the base upstream and list the layered upstreams in that order, then restores this
// exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers3',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
