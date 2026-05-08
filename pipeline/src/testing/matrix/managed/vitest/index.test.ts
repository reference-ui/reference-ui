import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createManagedVitestConfigSource } from './index.js'

describe('managed Vitest config', () => {
  it('creates the shared unit-test include contract', () => {
    assert.equal(createManagedVitestConfigSource(), [
      '/*',
      ' * This file is generated and managed by pipeline.',
      ' */',
      "import { defineConfig } from 'vitest/config'",
      '',
      'export default defineConfig({',
      '  test: {',
      "    include: ['tests/unit/**/*.test.{ts,tsx}'],",
      '  },',
      '})',
      '',
    ].join('\n'))
  })

  it('includes global setup when requested', () => {
    const config = createManagedVitestConfigSource({
      globalSetupPath: './tests/unit/global-setup.ts',
    })

    assert.match(config, /globalSetup: \['\.\/tests\/unit\/global-setup\.ts'\]/)
  })
})