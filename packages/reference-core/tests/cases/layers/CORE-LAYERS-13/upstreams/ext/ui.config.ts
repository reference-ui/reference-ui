// Config for the CORE-LAYERS-13 extends upstream. It takes its token and utility sources and
// emits a real published base system the consumer extends, so its rules rank below the layer.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers13-ext',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
