// Config for the NEO-DIAG-01 world. It takes the case fixture and emits
// the neo-diag-01 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-diag-01',
  include: ['theme/**/*.{ts,tsx}'],
  staticCss: { notAStyleProp: ['x'] },
})
