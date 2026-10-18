// ui.config.ts — system config for the CORE-RECIPE-12 world. Takes the world
// root and emits the core-recipe12 system name plus the src include glob.
// Sync reads it before extracting the conjunction recipe.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-recipe12',
  include: ['src/**/*.{js,ts,tsx}'],
})
