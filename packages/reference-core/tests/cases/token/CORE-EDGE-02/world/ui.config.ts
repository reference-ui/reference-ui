// ui.config.ts — sync config for the EDGE-02 world: 'core-edge2' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-edge2',
  include: ['src/**/*.{js,ts,tsx}'],
})
