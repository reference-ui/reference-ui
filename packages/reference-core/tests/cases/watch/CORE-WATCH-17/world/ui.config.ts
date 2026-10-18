// ui.config.ts for the CORE-WATCH-17 world. It takes the theme sources under theme/ as its include, so the watch and the
// types build both scan them. It emits the default config the sync reads, named core-watch17; the watch runs with --json.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-watch17',
  include: ['theme/**/*.{ts,tsx}'],
})
