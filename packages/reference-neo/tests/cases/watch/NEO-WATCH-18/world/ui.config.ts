// ui.config.ts for the NEO-WATCH-18 world. It takes the theme sources under theme/ as its include, so the watch and the
// types build both scan them. It emits the default config the sync reads, named neo-watch18; the spec adds a file that
// imports a missing type, then removes it.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch18',
  include: ['theme/**/*.{ts,tsx}'],
})
