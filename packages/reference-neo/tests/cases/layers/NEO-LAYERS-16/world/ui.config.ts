// Config for the NEO-LAYERS-16 world. It takes the sync defaults with strict colours and no
// upstreams, so it emits a strict consumer. The spec rewrites this file to list the up upstream
// under layers, then under extends as the control, and restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers16',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  strict: ['colors'],
})
