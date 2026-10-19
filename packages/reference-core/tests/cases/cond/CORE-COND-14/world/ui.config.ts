// Config for the CORE-COND-14 world. It takes no inputs beyond the sync
// defaults and emits the core-cond14 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-cond14',
  include: ['src/**/*.{js,ts,tsx}'],
})
