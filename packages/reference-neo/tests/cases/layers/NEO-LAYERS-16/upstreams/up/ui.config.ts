// Config for the NEO-LAYERS-16 layered upstream. It takes its own token fragment and emits a real
// published base system. The consumer lists that base system under layers, or under extends in
// the control leg, so the spec syncs this directory mid-run and every artefact is sync output.

import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-layers16-up',
  include: ['theme/**/*.{ts,tsx}'],
})
