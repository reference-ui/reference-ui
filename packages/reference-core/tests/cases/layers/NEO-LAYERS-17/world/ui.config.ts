// Config for the NEO-LAYERS-17 world. It takes the sync defaults with no upstreams: the spec rewrites this file
// mid-run to import brandUp from src/system/up.ts and list the branded upstream under layers, then restores this
// exact spelling in a finally, so the tree is canonical whatever the run does.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers17',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
