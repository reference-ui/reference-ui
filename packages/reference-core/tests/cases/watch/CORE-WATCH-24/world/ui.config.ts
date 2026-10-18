// World config for CORE-WATCH-24: a Core config named for the case, whose include glob reaches theme/. The spec makes its
// own temp world with a dangling link, so this one only has to serve the probe page. It takes nothing and emits the config.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-24',
  include: ['theme/**/*.{ts,tsx}'],
})
