// ui.config.ts — sync config for the TOKEN-13 world: 'core-token13' over src/**/*.{js,ts,tsx}.
// Takes the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-token13',
  include: ['src/**/*.{js,ts,tsx}'],
})
