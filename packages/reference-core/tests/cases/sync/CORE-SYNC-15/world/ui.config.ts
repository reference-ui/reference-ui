// ui.config.ts — sync config for the SYNC-15 world: 'core-sync15' over src/**/*.{js,ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync15',
  include: ['src/**/*.{js,ts,tsx}'],
})
