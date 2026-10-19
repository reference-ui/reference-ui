// Config for the CORE-CHAIN-15 world. It takes the sync defaults and emits a standalone build with no upstreams: the
// spec syncs and installs the upstream package mid-run, rewrites this file to extend the base system it published, then
// restores this exact spelling in a finally, so the tree stays canonical.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain15',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
