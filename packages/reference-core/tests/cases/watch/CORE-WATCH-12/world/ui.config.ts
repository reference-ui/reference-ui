// World config for CORE-WATCH-12: a Core config named for the case, with the theme/ include glob. The spec makes its own
// temp worlds, so this one only has to serve the probe page. It takes nothing and emits the config.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch-12',
  include: ['theme/**/*.{ts,tsx}'],
})
