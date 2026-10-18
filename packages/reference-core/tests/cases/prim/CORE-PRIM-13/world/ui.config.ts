// ui.config.ts — system config for the CORE-PRIM-13 world. Takes the world
// root and emits the core-prim13 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting the primitive props.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-prim13',
  include: ['src/**/*.{js,ts,tsx}'],
})
