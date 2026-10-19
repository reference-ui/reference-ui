// Config for the CORE-CHAIN-16 app. It takes the sync defaults and emits a standalone build: nothing in `extends` or
// `layers`, so no composed system backs the classes the installed package's runtime mints. The spec rewrites this
// file to compose another system for the partly composed leg, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain16',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
