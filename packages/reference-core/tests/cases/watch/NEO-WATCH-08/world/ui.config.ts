// ui.config.ts for the NEO-WATCH-08 world. It takes the theme sources under theme/ as its include, so the watch and the
// types build both scan them. It emits the default config that the sync reads, named neo-watch08.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch08',
  include: ['theme/**/*.{ts,tsx}'],
})
