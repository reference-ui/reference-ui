// ui.config.ts for the CORE-WATCH-08 world. It takes the theme sources under theme/ as its include, so the watch and the
// types build both scan them. It emits the default config that the sync reads, named core-watch08.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch08',
  include: ['theme/**/*.{ts,tsx}'],
})
