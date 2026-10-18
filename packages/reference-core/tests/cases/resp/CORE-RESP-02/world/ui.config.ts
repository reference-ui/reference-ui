// ui.config.ts — system config for the CORE-RESP-02 world. Takes the world
// root and emits the core-resp2 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting css() calls.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-resp2',
  include: ['src/**/*.{js,ts,tsx}'],
})
