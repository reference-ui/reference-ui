/**
 * Reference Icons — design-system consumer config for `ref sync` benchmarks.
 *
 * Emits `.reference-ui/` alongside this package when you run `pnpm run sync` from here.
 * For day-to-day builds, icons still resolve styled types via `../reference-lib/.reference-ui`
 * until you sync locally.
 */

import { defineConfig } from '@reference-ui/core'

export default defineConfig({
  name: 'reference-ui-icons',
  include: ['src/**/*.{ts,tsx}'],
  extends: [],
  debug: false,
})
