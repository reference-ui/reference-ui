// ui.config.ts for the NEO-WATCH-16 world. It takes the theme sources under theme/ as its include, so the watch and the
// types build both scan them. It emits the default config the sync reads, named neo-watch16; the spec swaps in a config
// whose top-level await never settles, then restores this file in a finally.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch16',
  include: ['theme/**/*.{ts,tsx}'],
})
