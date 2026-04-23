import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createMatrixConsumerPackageJson } from './package-json.js'

describe('createMatrixConsumerPackageJson', () => {
  it('includes the staged core and lib versions in dependencies', () => {
    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        coreVersion: '0.0.16',
        libVersion: '0.0.19',
      }),
    ) as {
      dependencies: Record<string, string>
      scripts: Record<string, string>
    }

    assert.deepEqual(packageJson.dependencies, {
      '@reference-ui/core': '0.0.16',
      '@reference-ui/lib': '0.0.19',
      react: '^19.2.0',
      'react-dom': '^19.2.0',
    })
    assert.equal(packageJson.scripts.sync, 'ref sync')
  })
})