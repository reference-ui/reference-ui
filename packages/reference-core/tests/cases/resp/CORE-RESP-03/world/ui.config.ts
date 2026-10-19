// ui.config.ts — sync config for the RESP-03 world: 'core-resp3' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-resp3',
  include: ['src/**/*.{js,ts,tsx}'],
})
