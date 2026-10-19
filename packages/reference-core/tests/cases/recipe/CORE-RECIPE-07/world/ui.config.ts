// ui.config.ts — sync config for the RECIPE-07 world: 'core-recipe07' over src/**/*.{js,ts,tsx}.
// Takes the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-recipe07',
  include: ['src/**/*.{js,ts,tsx}'],
})
