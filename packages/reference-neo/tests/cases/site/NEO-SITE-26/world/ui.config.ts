// Config for the NEO-SITE-26 world. It takes no inputs beyond the sync
// defaults and emits the site-26 system name plus the src include glob,
// so the extractor scans the entry during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-26',
  include: ['src/**/*.{js,ts,tsx}'],
})
