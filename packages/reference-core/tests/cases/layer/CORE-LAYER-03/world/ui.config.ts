// Config for the CORE-LAYER-03 world. It takes no inputs beyond the sync
// defaults and emits the core-layer3 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layer3',
  include: ['src/**/*.{js,ts,tsx}'],
})
