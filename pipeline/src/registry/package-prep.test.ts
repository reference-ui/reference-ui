import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { WorkspacePackage } from '../build/types.js'
import { preparePackageJsonForLocalRegistry, resolveWorkspaceProtocolVersion } from './package-prep.js'

describe('resolveWorkspaceProtocolVersion', () => {
  it('rewrites workspace:* to the concrete workspace version', () => {
    const versions = new Map([['@reference-ui/core', '0.0.16']])

    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', 'workspace:*', versions), '0.0.16')
  })

  it('preserves workspace range prefixes when pnpm would publish them that way', () => {
    const versions = new Map([['@reference-ui/core', '0.0.16']])

    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', 'workspace:^', versions), '^0.0.16')
    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', 'workspace:~', versions), '~0.0.16')
  })

  it('passes through non-workspace dependency specs unchanged', () => {
    const versions = new Map([['@reference-ui/core', '0.0.16']])

    assert.equal(resolveWorkspaceProtocolVersion('@reference-ui/core', '^0.0.15', versions), '^0.0.15')
  })
})

describe('preparePackageJsonForLocalRegistry', () => {
  const fixturePackage: WorkspacePackage = {
    dependencies: {},
    dir: '/tmp/fixture',
    name: '@fixtures/extend-library',
    private: true,
    scripts: {},
    version: '0.0.0',
  }

  it('removes private and rewrites workspace protocol specs across dependency buckets', () => {
    const workspacePackageVersions = new Map([
      ['@reference-ui/core', '0.0.16'],
      ['@reference-ui/icons', '0.0.16'],
      ['@reference-ui/lib', '0.0.19'],
    ])

    const prepared = preparePackageJsonForLocalRegistry(
      fixturePackage,
      {
        dependencies: {
          '@reference-ui/core': 'workspace:*',
        },
        devDependencies: {
          '@reference-ui/lib': 'workspace:^',
        },
        optionalDependencies: {
          '@reference-ui/icons': 'workspace:~',
        },
        peerDependencies: {
          react: '>=18',
        },
        private: true,
      },
      workspacePackageVersions,
    )

    assert.equal(prepared.private, undefined)
    assert.deepEqual(prepared.dependencies, {
      '@reference-ui/core': '0.0.16',
    })
    assert.deepEqual(prepared.devDependencies, {
      '@reference-ui/lib': '^0.0.19',
    })
    assert.deepEqual(prepared.optionalDependencies, {
      '@reference-ui/icons': '~0.0.16',
    })
    assert.deepEqual(prepared.peerDependencies, {
      react: '>=18',
    })
  })
})