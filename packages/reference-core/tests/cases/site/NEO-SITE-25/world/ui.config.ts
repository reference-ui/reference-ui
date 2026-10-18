// Config for the NEO-SITE-25 world. It takes no inputs beyond the sync
// defaults and emits the site-25 system name plus the src include glob,
// so the extractor scans the world and meets the binary-fold shapes.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-25',
  include: ['src/**/*.{js,ts,tsx}'],
})
