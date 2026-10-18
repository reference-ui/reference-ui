// Config for the CORE-LAYERS-05 world. It takes the canonical valid spelling, with an
// explicit empty layers array, and emits a standalone build for the runner to sync.
// The spec never rewrites this file: its bad configs ride temp dirs instead.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers5',
  include: ['theme/**/*.{ts,tsx}'],
  layers: [],
})
