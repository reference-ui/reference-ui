// Config for the NEO-MERGE-05 world. It takes no inputs beyond the sync
// defaults and emits the merge-05 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-merge-05',
  include: ['src/**/*.{js,ts,tsx}'],
})
