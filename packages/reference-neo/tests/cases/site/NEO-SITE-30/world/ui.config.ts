// Config for the NEO-SITE-30 world. It takes no inputs beyond the sync
// defaults and emits the site-30 system name plus the src include glob,
// so the extractor scans the world and meets the partial guard.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-30',
  include: ['src/**/*.{js,ts,tsx}'],
})
