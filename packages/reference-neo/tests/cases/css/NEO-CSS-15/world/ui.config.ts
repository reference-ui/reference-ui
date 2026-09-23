// ui.config.ts — system config for the NEO-CSS-15 world. Takes the world
// root and emits the neo-css15 system name plus the src include glob. Sync
// reads it before extracting the viewport-probe css() call.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-css15',
  include: ['src/**/*.{js,ts,tsx}'],
})
