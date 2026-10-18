// ui.config.ts — system config for the NEO-RESP-10 world. Takes the world
// root and emits the neo-resp10 system name plus the src include glob. Sync
// reads it before extracting the viewport-contract styles.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-resp10',
  include: ['src/**/*.{js,ts,tsx}'],
})
