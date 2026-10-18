// Config for the CORE-LAYERS-04 upstream. It takes its root fragment and emits
// the real published base system the consumer layers or extends: the spec syncs
// this directory mid-run, so the upstream entry is genuine sync output on disk.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers4-up',
  include: ['theme/**/*.{ts,tsx}'],
})
