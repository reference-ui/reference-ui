// Config for the CORE-LAYERS-16 world. It takes the sync defaults with strict colours and no
// upstreams, so it emits a strict consumer. The spec rewrites this file to list the up upstream
// under layers, then under extends as the control, and restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers16',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  strict: ['colors'],
})
