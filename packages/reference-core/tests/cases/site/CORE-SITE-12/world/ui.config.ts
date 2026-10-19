// ui.config.ts — sync config for the SITE-12 world: 'core-site-12' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-12',
  include: ['src/**/*.{js,ts,tsx}'],
})
