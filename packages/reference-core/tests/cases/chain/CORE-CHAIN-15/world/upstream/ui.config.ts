// Config for the CORE-CHAIN-15 upstream package, `@fixture/chain15`. It takes the package's sources and emits a real
// published base system plus a bound `react.mjs`: the app extends the base system, and the package's built `dist/`
// renders through the bound runtime, so every class it mints is qualified with this package's name.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain15-up',
  include: ['src/**/*.{ts,tsx}'],
})
