// ui.config.ts — sync config for the SYNC-08 world: 'core-sync8' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync8',
  include: ['theme/**/*.{ts,tsx}'],
})
