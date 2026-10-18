// Config for the NEO-SITE-04 world. It takes no inputs beyond the sync
// defaults and emits the site-04 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-site-04',
  include: ['src/**/*.{js,ts,tsx}'],
})
