// Config for the NEO-SITE-06 world. It takes no inputs beyond the sync
// defaults and emits the site-06 system name plus the src include glob,
// so the extractor scans the world and meets the dynamic call value.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-06',
  include: ['src/**/*.{js,ts,tsx}'],
})
