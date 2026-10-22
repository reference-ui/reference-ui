// ui.config.ts — sync config for the SYNC-19 world: 'core-sync19' over theme and component files. Takes the
// fragment sources under include and emits the generated folder the spec reads.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync19',
  include: ['theme/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
})
