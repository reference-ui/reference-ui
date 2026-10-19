// Config for the CORE-CSS-03 world. It takes no inputs beyond the sync
// defaults and emits the core-css3 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-css3',
  include: ['src/**/*.{js,ts,tsx}'],
})
