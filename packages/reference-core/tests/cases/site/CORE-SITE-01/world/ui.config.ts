// Config for the CORE-SITE-01 world. It takes no inputs beyond the sync
// defaults and emits the site-01 system name plus the src include glob,
// so the extractor scans the world and meets the literal ternary.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-site-01',
  include: ['src/**/*.{js,ts,tsx}'],
})
