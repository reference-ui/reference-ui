// ui.config.ts — sync config for the RECIPE-05 world: 'core-recipe' over src/**/*.{js,ts,tsx}.
// Takes the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-recipe',
  include: ['src/**/*.{js,ts,tsx}'],
})
