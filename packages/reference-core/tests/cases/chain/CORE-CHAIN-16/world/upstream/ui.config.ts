// Config for the CORE-CHAIN-16 upstream package, `@fixture/chain16`. It takes the package's sources and emits a real
// published base system under its own name, `core-chain16-up`: the system the app's warnings must name, and the one
// the app never composes here.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain16-up',
  include: ['src/**/*.{ts,tsx}'],
})
