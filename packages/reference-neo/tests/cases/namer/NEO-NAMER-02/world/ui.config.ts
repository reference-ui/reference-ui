// Config for the NEO-NAMER-02 world. It takes no inputs beyond the sync
// defaults and emits the namer-02 system name plus the src include glob,
// so the extractor finds the world's css() calls during every run.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-namer-02',
  include: ['src/**/*.{js,ts,tsx}'],
})
