// Config for the NEO-LAYERS-10 world. It takes the sync defaults with no upstreams: the spec
// rewrites this file mid-run to list the up upstream under layers, then restores this exact
// spelling in a finally, so the tree is canonical whatever the run does.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers10',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
