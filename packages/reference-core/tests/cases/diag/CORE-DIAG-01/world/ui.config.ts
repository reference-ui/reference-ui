// Config for the CORE-DIAG-01 world. It takes the case fixture and emits
// the core-diag-01 system over the theme glob, so the whole compiler finds
// the world's style calls during the spec's compile.
import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-diag-01',
  include: ['theme/**/*.{ts,tsx}'],
  staticCss: { notAStyleProp: ['x'] },
})
