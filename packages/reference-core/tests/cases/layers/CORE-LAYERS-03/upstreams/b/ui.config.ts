// Config for the CORE-LAYERS-03 layered upstream B. It takes its token and utility
// sources and emits a real published base system that the consumer reads through the
// statement. The spec syncs this directory for real, so every entry is genuine sync
// output on disk.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers3-b',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
