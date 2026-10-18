// Config for the NEO-CHAIN-06 world. It takes the sync defaults and emits a
// standalone build with no upstreams: the spec rewrites this file mid-run to
// extend the freshly synced upstream base system, then restores this exact
// spelling in a finally, so the tree is canonical whatever the run does.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain6',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
