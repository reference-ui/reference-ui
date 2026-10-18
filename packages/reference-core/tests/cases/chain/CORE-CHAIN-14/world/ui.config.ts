// Config for the CORE-CHAIN-14 app. It takes the sync defaults and emits a standalone build with no upstreams.
// The spec rewrites this file mid-run to extend the freshly synced upstream, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain14',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
