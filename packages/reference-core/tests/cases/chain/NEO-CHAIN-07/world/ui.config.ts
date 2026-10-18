// Config for the NEO-CHAIN-07 world. It takes the sync defaults and emits a
// standalone build with no upstreams: the spec rewrites this file mid-run to
// extend the freshly synced upstream base system, then restores this exact
// spelling in a finally, so the tree is canonical whatever the run does.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-chain7',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
  extends: [],
})
