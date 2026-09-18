// Config for the NEO-SITE-17 world. It takes no inputs beyond the sync
// defaults and emits the site-17 system name plus the src include glob,
// so the extractor scans the world and meets the const-bound ternary.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-17',
  include: ['src/**/*.{js,ts,tsx}'],
})
