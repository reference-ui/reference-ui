// Config for the NEO-SITE-23 world. It takes no inputs beyond the sync
// defaults and emits the site-23 system name plus the src include glob,
// so the extractor scans the world and meets the fold shapes.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-23',
  include: ['src/**/*.{js,ts,tsx}'],
})
