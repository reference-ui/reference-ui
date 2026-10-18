// Config for the NEO-SITE-05 world. It takes no inputs beyond the sync
// defaults and emits the site-05 system name plus the src include glob,
// so the extractor scans the world and proves the local css call is silent.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-05',
  include: ['src/**/*.{js,ts,tsx}'],
})
