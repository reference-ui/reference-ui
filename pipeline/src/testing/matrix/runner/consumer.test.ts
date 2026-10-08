import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { registryManifestVersion, type RegistryManifestPackage } from '../../../registry/types.js'
import {
  collectWorkspaceProtocolDependencyNames,
  createStagedTarballFileName,
  matrixPackageLogPrefix,
  resolveMatrixInternalTarballSpecs,
} from './consumer.js'

describe('matrix runner consumer helpers', () => {
  it('collects only workspace protocol dependency names', () => {
    assert.deepEqual(
      collectWorkspaceProtocolDependencyNames({
        '@reference-ui/neo': 'workspace:*',
        react: '^19.2.0',
        '@reference-ui/lib': 'workspace:^',
      }),
      ['@reference-ui/neo', '@reference-ui/lib'],
    )
  })

  it('builds staged tarball file names from manifest packages', () => {
    assert.equal(
      createStagedTarballFileName({
        hash: '1234567890abcdef',
        internalDependencies: [],
        name: '@reference-ui/neo',
        sourceDir: '/tmp/neo',
        tarballFileName: 'reference-ui-neo-0.0.41.tgz',
        tarballPath: '/tmp/neo.tgz',
        version: '0.0.41',
      }),
      'reference-ui-neo-0.0.41-12345678.tgz',
    )
  })

  it('resolves staged tarball specs for workspace protocol dependencies', () => {
    const manifestPackages: RegistryManifestPackage[] = [
      {
        hash: 'neohash123456789',
        internalDependencies: [],
        name: '@reference-ui/neo',
        sourceDir: '/tmp/neo',
        tarballFileName: 'reference-ui-neo-0.0.41.tgz',
        tarballPath: '/tmp/neo.tgz',
        version: '0.0.41',
      },
      {
        hash: 'libhash1234567890',
        internalDependencies: ['@reference-ui/neo'],
        name: '@reference-ui/lib',
        sourceDir: '/tmp/lib',
        tarballFileName: 'reference-ui-lib-0.0.44.tgz',
        tarballPath: '/tmp/lib.tgz',
        version: '0.0.44',
      },
    ]

    assert.deepEqual(
      resolveMatrixInternalTarballSpecs(
        {
          dependencies: {
            '@reference-ui/neo': 'workspace:*',
            react: '^19.2.0',
          },
          devDependencies: {
            '@reference-ui/lib': 'workspace:*',
          },
          name: '@matrix/distro',
          private: true,
          type: 'module',
          version: '0.0.0-test',
        },
        manifestPackages,
      ),
      [
        {
          absoluteTarballPath: '/tmp/neo.tgz',
          packageName: '@reference-ui/neo',
          specifier: 'file:.matrix-tarballs/reference-ui-neo-0.0.41-neohash1.tgz',
          stagedFileName: 'reference-ui-neo-0.0.41-neohash1.tgz',
        },
        {
          absoluteTarballPath: '/tmp/lib.tgz',
          packageName: '@reference-ui/lib',
          specifier: 'file:.matrix-tarballs/reference-ui-lib-0.0.44-libhash1.tgz',
          stagedFileName: 'reference-ui-lib-0.0.44-libhash1.tgz',
        },
      ],
    )
  })

  it('formats package names for log prefixes', () => {
    assert.equal(matrixPackageLogPrefix('@matrix/distro'), 'matrix-distro')
    assert.equal(matrixPackageLogPrefix('@matrix/lib', 'react19', 'react19'), 'matrix-lib')
    assert.equal(matrixPackageLogPrefix('@matrix/lib', 'react17', 'react19'), 'matrix-lib-react17')
  })
})