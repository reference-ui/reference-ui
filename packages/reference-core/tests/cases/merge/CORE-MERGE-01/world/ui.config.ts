// Config for the CORE-MERGE-01 world. It takes no inputs beyond the sync
// defaults and emits the merge-01 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-merge-01',
  include: ['src/**/*.{js,ts,tsx}'],
})
