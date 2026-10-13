// Config for the NEO-LAYERS-01 extends upstream. It takes its own token
// fragment and one utility source, and emits a real published base system
// the consumer extends: the spec syncs this directory mid-run, so the extends
// entry is genuine sync output on disk, never a hand-built stand-in.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers1-ext',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
