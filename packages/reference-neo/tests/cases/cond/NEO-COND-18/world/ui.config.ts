// ui.config.ts — system config for the NEO-COND-18 world. Takes the world
// root and emits the neo-cond18 system name plus the src include glob. Sync
// reads it before extracting the sibling-selector css() calls.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-cond18',
  include: ['src/**/*.{js,ts,tsx}'],
})
