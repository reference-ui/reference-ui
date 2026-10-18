// ui.config.ts — system config for the NEO-PRIM-13 world. Takes the world
// root and emits the neo-prim13 system name plus the src include glob. Sync
// reads it before compiling fragments and extracting the primitive props.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-prim13',
  include: ['src/**/*.{js,ts,tsx}'],
})
