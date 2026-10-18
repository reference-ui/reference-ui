// ui.config.ts — system config for the CORE-CSS-15 world. Takes the world
// root and emits the core-css15 system name plus the src include glob. Sync
// reads it before extracting the viewport-probe css() call.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-css15',
  include: ['src/**/*.{js,ts,tsx}'],
})
