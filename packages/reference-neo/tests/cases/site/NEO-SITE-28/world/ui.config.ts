// Config for the NEO-SITE-28 world. It takes no inputs beyond the sync
// defaults and emits the site-28 system name plus the src include glob,
// so the extractor scans the entry, both wrappers, and the shadow file.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-28',
  include: ['src/**/*.{js,ts,tsx}'],
})
