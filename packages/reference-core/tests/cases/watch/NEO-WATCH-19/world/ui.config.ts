// World config for NEO-WATCH-19: a Neo config named for the case, with the theme/ include glob. The spec makes
// its own temp world, so this one only has to serve the probe page. It takes nothing and emits the config.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch-19',
  include: ['theme/**/*.{ts,tsx}'],
})
