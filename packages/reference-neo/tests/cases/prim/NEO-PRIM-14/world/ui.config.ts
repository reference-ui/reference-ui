// ui.config.ts — system config for the NEO-PRIM-14 world. Takes the world
// root and emits the neo-prim14 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting the island tree.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-prim14',
  include: ['src/**/*.{js,ts,tsx}'],
})
