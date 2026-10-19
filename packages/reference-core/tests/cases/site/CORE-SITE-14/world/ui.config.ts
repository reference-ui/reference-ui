// ui.config.ts — sync config for the SITE-14 world: 'core-site14' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site14',
  include: ['src/**/*.{js,ts,tsx}'],
})
