// Config for the NEO-LAYERS-04 upstream. It takes its root fragment and emits
// the real published base system the consumer layers or extends: the spec syncs
// this directory mid-run, so the upstream entry is genuine sync output on disk.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers4-up',
  include: ['theme/**/*.{ts,tsx}'],
})
