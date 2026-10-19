// ui.config.ts — sync config for the SITE-11 world: 'core-site-11' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-11',
  include: ['src/**/*.{js,ts,tsx}'],
  jsxElements: ['Chart'],
})
