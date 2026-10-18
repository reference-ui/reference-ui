// Config for the CORE-CHAIN-11 app. It takes the sync defaults and emits a standalone build with no
// upstreams. The spec rewrites this file mid-run to extend the loop stand-in, expects the sync to
// reject the cycle, and restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain11',
  include: ['theme/**/*.{ts,tsx}'],
  extends: [],
})
