// ui.config.ts — system config for the NEO-RESP-01 world. Takes the world
// root and emits the neo-resp1 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting css() calls.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-resp1',
  include: ['src/**/*.{js,ts,tsx}'],
})
