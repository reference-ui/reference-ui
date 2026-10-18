// Config for the CORE-SITE-07 world. It takes no inputs beyond the sync
// defaults and emits the site-07 system name plus the src include glob,
// so the extractor scans both app and styles files during every run.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-07',
  include: ['src/**/*.{js,ts,tsx}'],
})
