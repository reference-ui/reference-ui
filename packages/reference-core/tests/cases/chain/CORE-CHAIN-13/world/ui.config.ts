// Config for the CORE-CHAIN-13 app. It takes the sync defaults and emits a standalone build with no upstreams.
// The spec rewrites this file mid-run to extend the base stand-in, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain13',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
