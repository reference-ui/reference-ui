// Config for the NEO-LAYERS-13 layered upstream. It takes its token and utility sources and
// emits a real published base system the consumer lists under layers.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers13-lay',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
