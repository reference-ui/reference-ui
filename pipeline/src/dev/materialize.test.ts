import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getApplicablePatches,
  getPackageNameFromPatchKey,
  parseWorkspacePatchedDependencies,
} from './materialize.js'
import type { MatrixFixturePackageJson } from '../testing/matrix/managed/package-json/index.js'

describe('parseWorkspacePatchedDependencies', () => {
  it('parses patchedDependencies from yaml content correctly', () => {
    const yaml = `
packages:
  - pipeline
  - packages/*

ignoredBuiltDependencies:
  - '@parcel/watcher'

patchedDependencies:
  react-cosmos@7.2.0: patches/react-cosmos@7.2.0.patch
  '@scoped/pkg@1.0.0': 'patches/scoped-pkg.patch'

linkWorkspacePackages: true
`
    const parsed = parseWorkspacePatchedDependencies(yaml)
    assert.deepEqual(parsed, {
      'react-cosmos@7.2.0': 'patches/react-cosmos@7.2.0.patch',
      '@scoped/pkg@1.0.0': 'patches/scoped-pkg.patch',
    })
  })

  it('returns empty object when no patchedDependencies section exists', () => {
    const yaml = `
packages:
  - packages/*
`
    const parsed = parseWorkspacePatchedDependencies(yaml)
    assert.deepEqual(parsed, {})
  })
})

describe('getPackageNameFromPatchKey', () => {
  it('extracts package names for standard and scoped packages', () => {
    assert.equal(getPackageNameFromPatchKey('react-cosmos@7.2.0'), 'react-cosmos')
    assert.equal(getPackageNameFromPatchKey('@scoped/pkg@1.2.3'), '@scoped/pkg')
    assert.equal(getPackageNameFromPatchKey('unversioned-pkg'), 'unversioned-pkg')
    assert.equal(getPackageNameFromPatchKey('@scoped/unversioned'), '@scoped/unversioned')
  })
})

describe('getApplicablePatches', () => {
  const allPatches = {
    'react-cosmos@7.2.0': 'patches/react-cosmos@7.2.0.patch',
    '@some/dep@2.0.0': 'patches/some-dep.patch',
  }

  it('filters out patches when target package has no matching dependencies', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      name: '@reference-ui/reference-docs',
      dependencies: {
        '@reference-ui/core': 'workspace:*',
        '@reference-ui/lib': 'workspace:*',
        '@tanstack/react-router': '1.163.2',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        vite: '^7.3.1',
        typescript: '~7.0.2',
      },
    }

    const applicable = getApplicablePatches(allPatches, fixturePackageJson)
    assert.deepEqual(applicable, {})
  })

  it('matches patches when target package includes the dependency in devDependencies', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      name: '@reference-ui/lib',
      dependencies: {
        '@reference-ui/core': 'workspace:*',
      },
      devDependencies: {
        'react-cosmos': '7.2.0',
        vite: '^7.3.1',
      },
    }

    const applicable = getApplicablePatches(allPatches, fixturePackageJson)
    assert.deepEqual(applicable, {
      'react-cosmos@7.2.0': 'patches/react-cosmos@7.2.0.patch',
    })
  })

  it('matches patches when target package includes the dependency in dependencies', () => {
    const fixturePackageJson: MatrixFixturePackageJson = {
      name: '@reference-ui/sample',
      dependencies: {
        '@some/dep': '^2.0.0',
      },
    }

    const applicable = getApplicablePatches(allPatches, fixturePackageJson)
    assert.deepEqual(applicable, {
      '@some/dep@2.0.0': 'patches/some-dep.patch',
    })
  })
})
