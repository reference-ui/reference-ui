/**
 * Sibling meta library that also extends `@fixtures/extend-library`.
 *
 * Used together with `@fixtures/meta-extend-library` to model diamond /
 * shared-base composition (T7, T12): two siblings built on the same base.
 */

import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendLibrary } from '@fixtures/extend-library/baseSystem'

export default defineConfig({
  name: 'meta-extend-library-sibling',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendLibrary],
  debug: false,
})
