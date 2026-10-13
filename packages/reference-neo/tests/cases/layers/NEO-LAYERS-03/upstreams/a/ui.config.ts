// Config for the NEO-LAYERS-03 base upstream A. It takes its token and utility sources
// and emits a real published base system that the consumer reads through the statement.
// The spec syncs this directory for real, so every entry is genuine sync output on
// disk.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers3-a',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
