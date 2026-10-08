// Config for the unsatisfiable sibling the NEO-STATIC-03 spec syncs. It takes
// no inputs and emits a project whose staticCss value references a token that
// does not exist, so sync must reject instead of minting a ghost atom. Kept
// outside the main world include, so the green sync never sees it.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-static-03-bad',
  include: ['src/**/*.ts'],
  staticCss: {
    color: ['{colors.nope}'],
  },
})
