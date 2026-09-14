/**
 * Vitest configuration for Reference RS multi-module workspace.
 * Defines isolated test projects for system, tasty, atlas, styletrace, virtualrs, and runtime.
 * Ensures modular execution without cross-suite setup leakage or monolithic test dependencies.
 */
import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const tastySetup = existsSync('./modules/tasty/tests/globalSetup.ts')
  ? './modules/tasty/tests/globalSetup.ts'
  : undefined

const atlasSetup = existsSync('./modules/atlas/tests/globalSetup.ts')
  ? './modules/atlas/tests/globalSetup.ts'
  : undefined

const virtualrsSetup = existsSync('./modules/virtualrs/tests/globalSetup.ts')
  ? './modules/virtualrs/tests/globalSetup.ts'
  : undefined

export default defineConfig({
  test: {
    testTimeout: 10000,
    projects: [
      {
        test: {
          name: 'system',
          include: [
            'modules/system/tests/**/*.test.ts',
            'modules/system/js/**/*.test.ts',
          ],
        },
      },
      {
        test: {
          name: 'tasty',
          include: [
            'modules/tasty/tests/**/*.test.ts',
            'modules/tasty/js/**/*.test.ts',
          ],
          globalSetup: tastySetup ? [tastySetup] : undefined,
        },
      },
      {
        test: {
          name: 'atlas',
          include: [
            'modules/atlas/tests/**/*.test.ts',
            'modules/atlas/js/**/*.test.ts',
          ],
          globalSetup: atlasSetup ? [atlasSetup] : undefined,
        },
      },
      {
        test: {
          name: 'styletrace',
          include: [
            'modules/styletrace/tests/**/*.test.ts',
            'modules/styletrace/js/**/*.test.ts',
          ],
        },
      },
      {
        test: {
          name: 'virtualrs',
          include: [
            'modules/virtualrs/tests/**/*.test.ts',
          ],
          globalSetup: virtualrsSetup ? [virtualrsSetup] : undefined,
        },
      },
      {
        test: {
          name: 'runtime',
          include: [
            'runtime/**/*.test.ts',
          ],
        },
      },
    ],
  },
})
