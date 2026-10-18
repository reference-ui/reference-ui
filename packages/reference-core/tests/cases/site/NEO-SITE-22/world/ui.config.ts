// Config for the NEO-SITE-22 world. It takes no inputs beyond the sync
// defaults and emits the site-22 system name plus the src include glob,
// so the extractor scans the world and meets the guarded spread.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-22',
  include: ['src/**/*.{js,ts,tsx}'],
})
