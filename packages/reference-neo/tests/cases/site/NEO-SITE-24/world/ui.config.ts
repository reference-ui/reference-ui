// Config for the NEO-SITE-24 world. It takes no inputs beyond the sync
// defaults and emits the site-24 system name plus the src include glob,
// so the extractor scans the entry during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-24',
  include: ['src/**/*.{js,ts,tsx}'],
})
