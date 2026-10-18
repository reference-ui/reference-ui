// Config for the CORE-DIAG-24 world. It takes the case fixture and emits
// the core-diag-24 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-diag-24',
  include: ['theme/**/*.{ts,tsx}'],
  logs: ['compiler'],
})
