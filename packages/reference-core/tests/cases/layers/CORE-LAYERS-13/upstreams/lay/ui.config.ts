// Config for the CORE-LAYERS-13 layered upstream. It takes its token and utility sources and
// emits a real published base system the consumer lists under layers.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers13-lay',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
