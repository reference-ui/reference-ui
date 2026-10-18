// Config for the NEO-LAYERS-02 upstream. It takes its token, recipe and utility sources
// and declares one custom element name, LayerCard, for its roster. The spec syncs this
// directory for real, so both consumer entries are genuine published output, never
// stand-ins.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers2-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  jsxElements: ['LayerCard'],
})
