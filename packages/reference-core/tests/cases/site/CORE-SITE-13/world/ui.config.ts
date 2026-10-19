// ui.config.ts — sync config for the SITE-13 world: 'core-site13' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site13',
  include: ['src/**/*.{js,ts,tsx}'],
})
