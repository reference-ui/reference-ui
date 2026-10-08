// Config for the NEO-SITE-15 world. It takes no inputs beyond the sync
// defaults and emits the site-15 system name plus the src include glob,
// so the extractor scans the world and meets the conditional ternary.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-15',
  include: ['src/**/*.{js,ts,tsx}'],
})
