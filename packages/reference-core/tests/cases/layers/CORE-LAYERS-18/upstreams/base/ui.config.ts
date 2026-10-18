// Config for the CORE-LAYERS-18 upstream base. It takes its token and utility sources and emits a real
// published base system named core-layers18-base. The spec syncs this directory for real before the legs
// run, and each leg extends or layers it through extendSystem.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers18-base',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
