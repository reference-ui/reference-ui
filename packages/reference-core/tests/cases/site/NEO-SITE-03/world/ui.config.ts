// Config for the NEO-SITE-03 world. It takes no inputs beyond the sync
// defaults and emits the site-03 system name plus the src include glob,
// so the extractor scans the world and meets the identifier spread.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-03',
  include: ['src/**/*.{js,ts,tsx}'],
})
