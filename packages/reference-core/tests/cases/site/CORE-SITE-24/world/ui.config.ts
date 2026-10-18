// Config for the CORE-SITE-24 world. It takes no inputs beyond the sync
// defaults and emits the site-24 system name plus the src include glob,
// so the extractor scans the entry during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-24',
  include: ['src/**/*.{js,ts,tsx}'],
})
