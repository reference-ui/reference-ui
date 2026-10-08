// ui.config.ts — system config for the NEO-RECIPE-12 world. Takes the world
// root and emits the neo-recipe12 system name plus the src include glob.
// Sync reads it before extracting the conjunction recipe.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-recipe12',
  include: ['src/**/*.{js,ts,tsx}'],
})
