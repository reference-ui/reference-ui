// Config for the NEO-LAYERS-03 self-named upstream. It takes its token and utility
// sources and emits a real published base system whose name equals the consumer's own
// name, the one identity the statement must leave out. The spec syncs this directory
// for real, so the entry is genuine sync output on disk.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers3',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
