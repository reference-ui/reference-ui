// Config for the NEO-DIAG-13 world. It takes the case fixture and emits
// the neo-diag-13 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-diag-13',
  include: ['theme/**/*.{ts,tsx}'],
})
