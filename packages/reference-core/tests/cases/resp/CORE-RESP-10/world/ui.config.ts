// ui.config.ts — system config for the CORE-RESP-10 world. Takes the world
// root and emits the core-resp10 system name plus the src include glob. Sync
// reads it before extracting the viewport-contract styles.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-resp10',
  include: ['src/**/*.{js,ts,tsx}'],
})
