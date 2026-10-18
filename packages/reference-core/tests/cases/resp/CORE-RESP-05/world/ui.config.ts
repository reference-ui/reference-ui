// ui.config.ts — system config for the CORE-RESP-05 world. Takes the world
// root and emits the core-resp5 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting css() calls.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-resp5',
  include: ['src/**/*.{js,ts,tsx}'],
})
