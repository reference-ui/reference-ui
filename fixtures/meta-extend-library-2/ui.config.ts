import { defineConfig } from '@reference-ui/core'
import { baseSystem as extendLibrary2 } from '@fixtures/extend-library-2'

/**
 * Meta library that extends `@fixtures/extend-library-2`.
 *
 * Together with `@fixtures/meta-extend-library`, this lets the chain matrix
 * model two parallel extend-chains landing in one app boundary (T16, T18).
 */
export default defineConfig({
  name: 'meta-extend-library-2',
  include: ['src/**/*.{ts,tsx}'],
  extends: [extendLibrary2],
  debug: false,
})
