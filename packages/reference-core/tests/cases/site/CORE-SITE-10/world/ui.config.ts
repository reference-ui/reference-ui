// ui.config.ts — sync config for the SITE-10 world: 'core-site-10' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-10',
  include: ['src/**/*.{js,ts,tsx}'],
})
