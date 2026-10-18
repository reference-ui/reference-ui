// World config for CORE-WATCH-25: a Core config named for the case, with the theme/ include glob the watch proofs resync
// under. It takes nothing and emits the config that the runner's sync hook and the spec's watch both load.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-25',
  include: ['theme/**/*.{ts,tsx}'],
})
