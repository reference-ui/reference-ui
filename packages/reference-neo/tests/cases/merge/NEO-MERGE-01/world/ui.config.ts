// Config for the NEO-MERGE-01 world. It takes no inputs beyond the sync
// defaults and emits the merge-01 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-merge-01',
  include: ['src/**/*.{js,ts,tsx}'],
})
