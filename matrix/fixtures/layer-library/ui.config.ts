/**
 * Sync config for the `@fixtures/layer-library` root package. Takes this
 * fixture's `src` files with no upstream (`extends: []`) and emits the
 * `baseSystem` fragment plus demo components the chain suites layer.
 * The root of every `layers` topology in `matrix/tests/chain`.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'layer-library',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
