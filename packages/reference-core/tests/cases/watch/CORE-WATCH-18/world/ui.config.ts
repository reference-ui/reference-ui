// ui.config.ts for the CORE-WATCH-18 world. It takes the theme sources under theme/ as its include, so the watch and the
// types build both scan them. It emits the default config the sync reads, named core-watch18; the spec adds a file that
// imports a missing type, then removes it.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch18',
  include: ['theme/**/*.{ts,tsx}'],
})
