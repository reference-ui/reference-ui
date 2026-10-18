// Config for the CORE-DIAG-34 world. It takes the case fixture and emits
// the core-diag-34 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-diag-34',
  include: ['theme/**/*.{ts,tsx}'],
  logs: ['compiler'],
})
