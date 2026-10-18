// Config for the CORE-CHAIN-07 upstream package. It takes the upstream root
// fragment and emits the real published base system the app extends: the
// spec syncs this directory mid-run, so the extends entry is genuine sync
// output on disk, never a hand-built stand-in.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain7-up',
  include: ['theme/**/*.{ts,tsx}'],
})
