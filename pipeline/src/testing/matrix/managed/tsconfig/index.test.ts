import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createMatrixConsumerTsconfig } from './index.js'

describe('createMatrixConsumerTsconfig', () => {
  it('returns the minimal downstream tsconfig used by the matrix consumer', () => {
    const tsconfig = JSON.parse(createMatrixConsumerTsconfig()) as {
      compilerOptions: Record<string, string | boolean>
      include: string[]
    }

    assert.deepEqual(tsconfig.compilerOptions, {
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'esnext',
      moduleResolution: 'bundler',
      types: [],
      target: 'es2022',
      strict: true,
      skipLibCheck: true,
    })
    assert.deepEqual(tsconfig.include, ['src/**/*', 'tests/**/*', 'ui.config.ts'])
  })
})
