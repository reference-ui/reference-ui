// Config for the NEO-COND-10 world. It takes no inputs beyond the sync
// defaults and emits the cond-10 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-cond-10',
  include: ['src/**/*.{js,ts,tsx}'],
})
