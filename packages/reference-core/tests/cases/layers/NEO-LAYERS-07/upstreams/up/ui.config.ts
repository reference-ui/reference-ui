// Config for the NEO-LAYERS-07 layered upstream. It takes its token, recipe and
// utility sources and emits a real published base system. The spec syncs this
// directory for real, so the layer entry is genuine sync output, never a stand-in.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers7-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
