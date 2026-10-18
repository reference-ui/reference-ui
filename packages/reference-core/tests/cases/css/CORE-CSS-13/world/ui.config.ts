// Config for the CORE-CSS-13 world. It takes no inputs beyond the sync
// defaults and emits the css-13 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-css13',
  include: ['src/**/*.{js,ts,tsx}'],
})
