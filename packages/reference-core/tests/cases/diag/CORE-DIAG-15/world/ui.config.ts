// Config for the CORE-DIAG-15 world. It takes the case fixture and emits
// the core-diag-15 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-diag-15',
  include: ['theme/**/*.{ts,tsx}'],
})
