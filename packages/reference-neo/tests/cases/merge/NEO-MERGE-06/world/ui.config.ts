// Config for the NEO-MERGE-06 world. It takes no inputs beyond the sync
// defaults and emits the merge-06 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-merge-06',
  include: ['src/**/*.{js,ts,tsx}'],
})
