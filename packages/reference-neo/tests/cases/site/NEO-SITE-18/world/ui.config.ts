// Config for the NEO-SITE-18 world. It takes no inputs beyond the sync
// defaults and emits the site-18 system name plus the src include glob,
// so the extractor scans the entry during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-18',
  include: ['src/**/*.{js,ts,tsx}'],
})
