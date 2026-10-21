/**
 * Sync config for the `@fixtures/extend-library` root package. Takes this
 * fixture's `src` files with no upstream (`extends: []`) and emits the
 * `baseSystem` fragment plus demo components the chain suites extend.
 * The root of every `extends` topology in `matrix/tests/chain`.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'extend-library',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
})
