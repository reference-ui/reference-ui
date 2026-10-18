// Config for the NEO-LAYERS-06 upstream. It takes its token fragment and utility
// source, and emits a real published base system the consumer layers or extends
// by a relative or a bare import. The spec syncs this directory mid-run, so the
// entry is genuine sync output on disk.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers6-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
