// Config for the NEO-CHAIN-07 upstream package. It takes the upstream root
// fragment and emits the real published base system the app extends: the
// spec syncs this directory mid-run, so the extends entry is genuine sync
// output on disk, never a hand-built stand-in.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain7-up',
  include: ['theme/**/*.{ts,tsx}'],
})
