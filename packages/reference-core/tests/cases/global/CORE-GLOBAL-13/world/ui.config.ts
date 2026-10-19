// Config for the CORE-GLOBAL-13 world. It takes no inputs beyond the sync
// defaults and emits the core-global-13 system name plus the src include
// glob, so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-global-13',
  include: ['src/**/*.{js,ts,tsx}'],
})
