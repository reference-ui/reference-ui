// ui.config.ts — system config for the NEO-PRIM-15 world. Takes the world
// root and emits the neo-prim15 system name plus the src include glob. Sync
// reads it before extracting the pair-shorthand primitive props.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-prim15',
  include: ['src/**/*.{js,ts,tsx}'],
})
