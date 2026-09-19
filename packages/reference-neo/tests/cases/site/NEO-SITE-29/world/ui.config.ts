// Config for the NEO-SITE-29 world. It takes no inputs beyond the sync
// defaults and emits the site-29 system name plus the src include glob,
// so the extractor scans the entry, the button, and the base file.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-29',
  include: ['src/**/*.{js,ts,tsx}'],
})
