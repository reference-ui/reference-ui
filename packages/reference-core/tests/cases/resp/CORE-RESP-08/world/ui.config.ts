// ui.config.ts — system config for the CORE-RESP-08 world. Takes the world
// root and emits the core-resp8 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting css() calls.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-resp8',
  include: ['src/**/*.{js,ts,tsx}'],
})
