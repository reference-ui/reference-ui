// ui.config.ts — system config for the CORE-RESP-04 world. Takes the world
// root and emits the core-resp4 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting css() calls.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-resp4',
  include: ['src/**/*.{js,ts,tsx}'],
})
