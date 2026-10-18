// Config for the CORE-LAYERS-15 layered upstream. It takes its token and utility sources
// and emits a real published base system. The consumer imports it by a relative path, so
// its file is a watch input, and the spec rebuilds it mid-run to drive re-sync.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers15-lc',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
