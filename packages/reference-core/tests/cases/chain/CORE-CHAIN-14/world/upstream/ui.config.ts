// Config for the CORE-CHAIN-14 upstream package. It takes the Tile source and emits the real published base system
// the app extends: the spec syncs this directory mid-run, so the extends entry is genuine sync output on disk.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain14-up',
  include: ['src/**/*.{ts,tsx}'],
})
