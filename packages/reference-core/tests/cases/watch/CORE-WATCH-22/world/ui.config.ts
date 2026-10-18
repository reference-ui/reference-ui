// World config for CORE-WATCH-22: a Core config named for the case, with the theme/ include glob. The spec makes
// its own temp world, so this one only has to serve the probe page. It takes nothing and emits the config.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-22',
  include: ['theme/**/*.{ts,tsx}'],
})
