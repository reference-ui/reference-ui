// World config for CORE-WATCH-13: a Core config named for the case, with theme/ as its include. The spec widens
// include to extra/ while a fragment there fails, then restores this file byte for byte. It emits the config
// the runner's sync and the spec's watch both load.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-13',
  include: ['theme/**/*.{ts,tsx}'],
})
