// ui.config.ts — sync config for the SYNC-07 world: 'core-sync7' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync7',
  include: ['theme/**/*.{ts,tsx}'],
})
