// ui.config.ts — sync config for the SYNC-20 world: 'core-sync20' over theme/**/*.{ts,tsx}. It imports only
// defineConfig from @reference-ui/core, so the canonical world syncs; the spec writes the misuse in its place.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync20',
  include: ['theme/**/*.{ts,tsx}'],
})
