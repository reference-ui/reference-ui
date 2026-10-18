// Config for the CORE-CHAIN-10 app, the consumer of the diamond d. It takes the sync defaults and emits a
// standalone build with no upstreams. The spec rewrites this file mid-run to import d and extend it,
// then restores this exact spelling in a finally.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-chain10',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
