// ui.config.ts — sync config for the SYNC-03 world: 'core-sync3' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync3',
  include: ['theme/**/*.{ts,tsx}'],
})
