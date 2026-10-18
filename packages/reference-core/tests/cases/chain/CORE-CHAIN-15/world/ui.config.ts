// Config for the CORE-CHAIN-15 world. It takes the sync defaults and emits a standalone build with no upstreams: the
// spec syncs the prebuilt package mid-run, rewrites this file to extend its materialized base system, then restores this
// exact spelling in a finally, so the tree stays canonical.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain15',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
