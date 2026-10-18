// Config for the CORE-LAYERS-02 upstream. It takes its token, recipe and utility sources
// and declares one custom element name, LayerCard, for its roster. The spec syncs this
// directory for real, so both consumer entries are genuine published output, never
// stand-ins.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers2-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  jsxElements: ['LayerCard'],
})
