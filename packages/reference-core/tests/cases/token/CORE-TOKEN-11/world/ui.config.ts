// ui.config.ts — sync config for the TOKEN-11 world: 'core-token11' over src/**/*.{js,ts,tsx}.
// Takes the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-token11',
  include: ['src/**/*.{js,ts,tsx}'],
})
