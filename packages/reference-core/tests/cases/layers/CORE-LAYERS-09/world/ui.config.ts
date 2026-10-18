// Config for the CORE-LAYERS-09 world. It takes the sync defaults with no upstreams: the
// spec rewrites this file mid-run to layer the up upstream, then restores this exact
// spelling in a finally, so the tree is canonical whatever the run does.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers9',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
