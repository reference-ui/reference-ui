// Config for the NEO-LAYERS-18 upstream base. It takes its token and utility sources and emits a real
// published base system named neo-layers18-base. The spec syncs this directory for real before the legs
// run, and each leg extends or layers it through extendSystem.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers18-base',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
