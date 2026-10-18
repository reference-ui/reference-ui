// ui.config.ts — system config for the CORE-PRIM-14 world. Takes the world
// root and emits the core-prim14 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting the island tree.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-prim14',
  include: ['src/**/*.{js,ts,tsx}'],
})
