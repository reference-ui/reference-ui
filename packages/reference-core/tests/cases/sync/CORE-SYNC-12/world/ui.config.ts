// ui.config.ts — sync config for the SYNC-12 world: 'core-sync12' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync12',
  include: ['theme/**/*.{ts,tsx}'],
})
