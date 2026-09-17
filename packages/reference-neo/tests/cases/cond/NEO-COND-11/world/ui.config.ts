// Config for the NEO-COND-11 world. It takes no inputs beyond the sync
// defaults and emits the cond-11 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-cond-11',
  include: ['src/**/*.{js,ts,tsx}'],
})
