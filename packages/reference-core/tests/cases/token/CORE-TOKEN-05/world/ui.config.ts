// ui.config.ts — sync config for the TOKEN-05 world: 'core-token5' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-token5',
  include: ['src/**/*.{js,ts,tsx}'],
})
