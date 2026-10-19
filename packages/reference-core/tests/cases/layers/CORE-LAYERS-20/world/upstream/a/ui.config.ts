// Config for the CORE-LAYERS-20 base package, a. It takes its token fragment and its component source, and emits a
// real published base system plus a bound `react.mjs`. Package b extends it, and the prebuilt fixture renders a's
// Badge through the bound runtime, so the Badge stamps `data-layer="core-layers20-a"`.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers20-a',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
