// Config for the NEO-CHAIN-14 app. It takes the sync defaults and emits a standalone build with no upstreams.
// The spec rewrites this file mid-run to extend the freshly synced upstream, then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain14',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
