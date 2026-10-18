// Config for the CORE-LAYERS-01 layered upstream. It takes its own token
// fragment and utility source, and emits a real published base system the
// consumer lists under layers: the spec syncs this directory mid-run, so the
// layer entry is genuine sync output, never a stand-in without streams.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers1-lay',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
