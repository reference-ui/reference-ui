// Config for the NEO-NAMER-03 world. It takes no inputs beyond the sync
// defaults and emits the namer-03 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-namer-03',
  include: ['src/**/*.{js,ts,tsx}'],
})
