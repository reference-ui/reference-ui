// Config for the NEO-CHAIN-06 upstream package. It takes the upstream token
// fragment and emits the real published base system the app extends: the
// spec syncs this directory mid-run, so the extends entry is genuine sync
// output on disk, never a hand-built stand-in.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain6-up',
  include: ['theme/**/*.{ts,tsx}'],
})
