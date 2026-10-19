// ui.config.ts — sync config for the TYPE-04 world: 'core-type' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-type',
  include: ['src/**/*.{js,ts,tsx}'],
})
