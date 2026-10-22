// ui.config.ts: sync config for the SYNC-18 world, 'core-sync18' over theme/**. Takes the fragment
// sources under include and emits the generated folder the runner syncs and the spec re-syncs by a doubled-slash root.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync18',
  include: ['theme/**'],
})
