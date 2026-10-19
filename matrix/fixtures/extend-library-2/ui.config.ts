/**
 * Independent extend fixture #2 (A2 in chain matrix). Used together with
 * `@fixtures/extend-library` to prove parallel `extends[]` (T9) and,
 * through `@fixtures/meta-extend-library-2`, parallel chains (T11, T13).
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'extend-library-2',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
})
