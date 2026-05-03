import { defineConfig } from '@reference-ui/core'

/**
 * Independent extend fixture #2 (A2 in chain matrix). Used together with
 * `@fixtures/extend-library` to prove parallel `extends[]` and parallel
 * chains (T11, T16, T18).
 */
export default defineConfig({
  name: 'extend-library-2',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
})
