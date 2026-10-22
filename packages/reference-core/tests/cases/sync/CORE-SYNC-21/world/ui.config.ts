// ui.config.ts — sync config for the SYNC-21 world: 'core-sync21' over theme/**/*.{ts,tsx}. It takes the fragment
// sources under include; the theme file reads baseSystem, so the spec expects sync to refuse this world.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-sync21',
  include: ['theme/**/*.{ts,tsx}'],
})
