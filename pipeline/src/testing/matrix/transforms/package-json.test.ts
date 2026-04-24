import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createMatrixConsumerPackageJson, type MatrixFixturePackageJson } from './package-json.js'

describe('createMatrixConsumerPackageJson', () => {
  it('preserves fixture scripts and rewrites workspace dependencies to staged versions', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      dependencies: {
        '@reference-ui/core': 'workspace:*',
        '@reference-ui/lib': 'workspace:*',
        react: '^19.2.0',
      },
      devDependencies: {
        typescript: '~5.9.3',
        vitest: '^4.0.18',
      },
      name: '@matrix/install',
      private: true,
      scripts: {
        test: 'vitest run && tsc --noEmit',
      },
      type: 'module',
    }

    const packageJson = JSON.parse(
      createMatrixConsumerPackageJson({
        coreVersion: '0.0.16',
        fixturePackageJson,
        libVersion: '0.0.19',
      }),
    ) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
      name: string
      private: boolean
      scripts: Record<string, string>
    }

    assert.deepEqual(packageJson.dependencies, {
      '@reference-ui/core': '0.0.16',
      '@reference-ui/lib': '0.0.19',
      react: '^19.2.0',
    })
    assert.deepEqual(packageJson.devDependencies, {
      typescript: '~5.9.3',
      vitest: '^4.0.18',
    })
    assert.equal(packageJson.name, '@matrix/install')
    assert.equal(packageJson.private, true)
    assert.equal(packageJson.scripts.test, 'vitest run && tsc --noEmit')
  })
})