// ui.config.ts — system config for the NEO-RESP-02 world. Takes the world
// root and emits the neo-resp2 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting css() calls.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-resp2',
  include: ['src/**/*.{js,ts,tsx}'],
})
