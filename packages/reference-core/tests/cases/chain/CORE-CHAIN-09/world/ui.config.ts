// Config for the CORE-CHAIN-09 app, the diamond's consumer. It takes the sync defaults and emits a
// standalone build with no upstreams. The spec rewrites this file mid-run to import branches b and c
// and extend them in each order, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain9',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
