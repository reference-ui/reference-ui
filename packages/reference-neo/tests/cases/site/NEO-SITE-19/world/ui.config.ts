// Config for the NEO-SITE-19 world. It takes no inputs beyond the sync
// defaults and emits the site-19 system name plus the src include glob,
// so the extractor scans the entry during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-19',
  include: ['src/**/*.{js,ts,tsx}'],
})
