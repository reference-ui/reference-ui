// ui.config.ts — sync config for the SYNC-09 world: 'core-sync09' over theme/**. Takes the fragment
// sources under include and emits the generated folder the specs sync and serve.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync09',
  include: ['theme/**'],
})
