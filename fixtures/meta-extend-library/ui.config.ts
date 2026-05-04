import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendLibrary } from '@fixtures/extend-library'

/**
 * Meta library that extends `@fixtures/extend-library`.
 *
 * Used by chain matrix tests to prove transitive `extends` chains:
 * App → extends → meta-extend-library → extends → extend-library.
 */
export default defineConfig({
  name: 'meta-extend-library',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendLibrary],
  debug: false,
})
