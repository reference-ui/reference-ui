// ui.config.ts — system config for the CORE-COND-18 world. Takes the world
// root and emits the core-cond18 system name plus the src include glob. Sync
// reads it before extracting the sibling-selector css() calls.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-cond18',
  include: ['src/**/*.{js,ts,tsx}'],
})
