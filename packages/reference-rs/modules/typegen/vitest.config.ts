/**
 * Vitest project for typegen consumer fixtures.
 * Runs tsc --noEmit against printed .d.ts goldens under tests/.
 * Isolated from other reference-rs suites; goldens still refresh via
 * TYPEGEN_UPDATE_GOLDENS=1 on cargo, not --update-goldens.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'typegen',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
  },
})
