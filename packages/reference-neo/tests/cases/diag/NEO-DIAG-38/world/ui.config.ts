// Config for the NEO-DIAG-38 world. It takes the case fixture and emits
// the neo-diag-38 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-diag-38',
  include: ['theme/**/*.{ts,tsx}'],
  logs: ['compiler'],
})
