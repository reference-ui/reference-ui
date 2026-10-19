// ui.config.ts — sync config for the SYNC-01 world: 'core-sync' over theme/**/*.{ts,tsx}. Takes the
// fragment sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync',
  include: ['theme/**/*.{ts,tsx}'],
})
