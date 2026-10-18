// Config for the CORE-LAYERS-14 cycle upstream. It takes its token and utility sources and
// emits a real published base system. The spec rewrites this file to extend the consumer
// world's published system before syncing it, so this upstream's streams carry the
// consumer's own name back, then restores this canonical spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers14-cycle',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
