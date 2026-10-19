/**
 * Independent layer fixture #2. Used together with `@fixtures/layer-library`
 * for tests that need multiple `layers[]` entries (T11, T18).
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'layer-library-2',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
})
