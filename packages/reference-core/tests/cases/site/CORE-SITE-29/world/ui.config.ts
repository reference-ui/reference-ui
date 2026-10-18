// Config for the CORE-SITE-29 world. It takes no inputs beyond the sync
// defaults and emits the site-29 system name plus the src include glob,
// so the extractor scans the entry, the button, and the base file.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-29',
  include: ['src/**/*.{js,ts,tsx}'],
})
