// Config for the CORE-LAYERS-19 upstream package, acme. It takes its token fragment and its component source,
// and emits a real published base system plus a bound `react.mjs`: the app composes the base system under
// extends or layers, and the prebuilt fixture renders acme's components through the bound runtime, so every
// element they render stamps `data-layer="core-layers19-acme"`.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers19-acme',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
