// ui.config.ts — sync config for the SYNC-11 world: 'core-sync11' over theme/**/*.{ts,tsx}. Takes
// the fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync11',
  include: ['theme/**/*.{ts,tsx}'],
})
