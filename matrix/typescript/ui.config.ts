import { baseSystem } from '@reference-ui/lib'
import { defineConfig } from '@reference-ui/core'

/**
 * Matrix package that exercises the codegen of strict-token wrappers.
 *
 * Pairs with `src/strict-tokens.assertions.ts` (type-level assertions using
 * `@ts-expect-error`) — `pnpm exec tsc --noEmit` confirms the wrappers are
 * actually applied to `SystemStyleObject` after `ref sync`.
 */
export default defineConfig({
  name: 'typescript',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
  strict: ['colors', 'radii'],
  debug: false,
})
