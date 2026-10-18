// World config for NEO-WATCH-23: a Neo config named for the case, whose include glob reaches no file. The spec makes
// its own temp world, so this one only has to serve the probe page. It takes nothing and emits the config.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch-23',
  include: ['nothing/**/*.ts'],
})
