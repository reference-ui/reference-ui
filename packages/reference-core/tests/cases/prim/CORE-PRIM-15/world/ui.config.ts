// ui.config.ts — system config for the CORE-PRIM-15 world. Takes the world
// root and emits the core-prim15 system name plus the src include glob. Sync
// reads it before extracting the pair-shorthand primitive props.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-prim15',
  include: ['src/**/*.{js,ts,tsx}'],
})
