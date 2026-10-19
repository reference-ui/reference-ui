// ui.config.ts — sync config for the SITE-09 world: 'core-site-09' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-09',
  include: ['src/**/*.{js,ts,tsx}'],
})
