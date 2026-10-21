/**
 * Meta library that extends `@fixtures/extend-library`.
 *
 * Used by chain matrix tests to prove transitive `extends` chains:
 * App → extends → meta-extend-library → extends → extend-library.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendLibrary } from '@fixtures/extend-library/baseSystem'

export default defineConfig({
  name: 'meta-extend-library',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendLibrary],
})
