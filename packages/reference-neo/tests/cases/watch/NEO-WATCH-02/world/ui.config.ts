// World config for NEO-WATCH-02: a Neo config named for the case, with the theme/ include
// glob the watch proofs resync under. It takes nothing and emits the config that the
// runner's sync hook and the spec's watch both load.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch-02',
  include: ['theme/**/*.{ts,tsx}'],
})
