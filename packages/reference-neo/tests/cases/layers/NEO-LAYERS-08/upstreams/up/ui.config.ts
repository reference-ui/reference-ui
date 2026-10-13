// Config for the NEO-LAYERS-08 layered upstream. It takes its token, font, keyframe,
// global-rule and utility sources and emits a real published base system. The spec
// syncs this directory for real, so the layer entry is genuine sync output.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers8-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
