// Config for the CORE-LAYERS-10 layered upstream. It takes its own token fragment and utility
// source, and emits a real published base system plus a react entry bound to its own layer.
// The consumer lists the base system under layers and imports the react entry's Div, so the spec
// syncs this directory mid-run and every artefact is sync output.

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'core-layers10-up',
  include: ['theme/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}'],
})
