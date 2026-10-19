// ui.config.ts — sync config for the PRIM-12 world: 'core-prim' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-prim',
  include: ['src/**/*.{js,ts,tsx}'],
})
