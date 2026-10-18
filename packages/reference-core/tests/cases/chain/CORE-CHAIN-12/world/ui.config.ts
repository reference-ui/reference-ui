// Config for the CORE-CHAIN-12 app. It takes the sync defaults and emits a standalone build with no
// upstreams, so the local tokens stand alone. The spec rewrites this file mid-run to extend the base and mid
// stand-ins, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain12',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [],
})
