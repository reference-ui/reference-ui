import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendLibrary } from '@fixtures/extend-library'

/**
 * Sibling meta library that also extends `@fixtures/extend-library`.
 *
 * Used together with `@fixtures/meta-extend-library` to model diamond /
 * shared-base composition (T7, T17): two siblings built on the same base.
 */
export default defineConfig({
  name: 'meta-extend-library-sibling',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendLibrary],
  debug: false,
})
