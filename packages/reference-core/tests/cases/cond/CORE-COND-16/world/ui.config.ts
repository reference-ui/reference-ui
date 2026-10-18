// Config for the CORE-COND-16 world. It takes no inputs beyond the sync
// defaults and emits the cond-16 system name plus the src include glob,
// so the extractor scans the entry during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-cond-16',
  include: ['src/**/*.{js,ts,tsx}'],
})
