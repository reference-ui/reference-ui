// Config for the CORE-LAYERS-07 layered upstream. It takes its token, recipe and
// utility sources and emits a real published base system. The spec syncs this
// directory for real, so the layer entry is genuine sync output, never a stand-in.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers7-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
