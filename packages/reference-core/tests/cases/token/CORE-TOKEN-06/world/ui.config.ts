// ui.config.ts — sync config for the TOKEN-06 world: 'core-token6' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-token6',
  include: ['src/**/*.{js,ts,tsx}'],
})
