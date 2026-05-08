import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, it } from 'node:test'

import { repoRoot } from '../workspace.js'
import {
  canReuseRustBuildRegistryArtifacts,
  createRustBuildHashAugmentation,
  createRustBuildRegistryArtifactsCacheKey,
} from './state.js'

describe('createRustBuildHashAugmentation', () => {
  it('returns null when there are no generated packages or overrides', () => {
    assert.equal(createRustBuildHashAugmentation([], undefined), null)
  })

  it('returns a stable hash when generated packages are present', () => {
    const first = createRustBuildHashAugmentation(
      [
        {
          hash: 'linux-hash',
          name: '@reference-ui/rust-linux-x64-gnu',
          version: '0.0.15',
        },
      ],
      {
        optionalDependencies: {
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        },
      },
    )
    const second = createRustBuildHashAugmentation(
      [
        {
          hash: 'linux-hash',
          name: '@reference-ui/rust-linux-x64-gnu',
          version: '0.0.15',
        },
      ],
      {
        optionalDependencies: {
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        },
      },
    )

    assert.ok(first)
    assert.equal(first, second)
  })
})

describe('createRustBuildRegistryArtifactsCacheKey', () => {
  it('normalizes the default target set and ordering', () => {
    assert.equal(
      createRustBuildRegistryArtifactsCacheKey('rust-hash'),
      createRustBuildRegistryArtifactsCacheKey('rust-hash', [
        'win32-x64-msvc',
        'darwin-arm64',
        'linux-x64-gnu',
        'darwin-x64',
      ]),
    )
  })

  it('separates force-built native artifacts from cache-eligible artifacts', () => {
    assert.notEqual(
      createRustBuildRegistryArtifactsCacheKey('rust-hash', undefined, false),
      createRustBuildRegistryArtifactsCacheKey('rust-hash', undefined, true),
    )
  })
})

describe('canReuseRustBuildRegistryArtifacts', () => {
  it('returns true when the cache key matches and generated tarballs still exist', async () => {
    const tarballDir = await mkdtemp(resolve(tmpdir(), 'reference-ui-rust-tarballs-'))
    const tarballPath = resolve(tarballDir, 'cached-rust-target.tgz')
    const relativeTarballPath = resolve(repoRoot, tarballPath).replace(`${repoRoot}/`, '')

    try {
      await mkdir(resolve(repoRoot, relativeTarballPath, '..'), { recursive: true })
      await writeFile(resolve(repoRoot, relativeTarballPath), 'tarball')

      assert.equal(
        canReuseRustBuildRegistryArtifacts(
          {
            cacheKey: 'rust-cache-key',
            generatedPackages: [
              {
                hash: 'generated-hash',
                internalDependencies: [],
                name: '@reference-ui/rust-darwin-arm64',
                sourceDir: 'packages/reference-rs/npm/darwin-arm64',
                tarballFileName: 'cached-rust-target.tgz',
                tarballPath: relativeTarballPath,
                version: '0.0.15',
              },
            ],
            packageHashAugmentations: {},
            preparedPackageJsonOverrides: {},
          },
          'rust-cache-key',
        ),
        true,
      )
    } finally {
      await rm(resolve(repoRoot, relativeTarballPath), { force: true })
      await rm(tarballDir, { recursive: true, force: true })
    }
  })

  it('returns false when the cache key differs or a generated tarball is missing', () => {
    assert.equal(
      canReuseRustBuildRegistryArtifacts(
        {
          cacheKey: 'rust-cache-key',
          generatedPackages: [
            {
              hash: 'generated-hash',
              internalDependencies: [],
              name: '@reference-ui/rust-darwin-arm64',
              sourceDir: 'packages/reference-rs/npm/darwin-arm64',
              tarballFileName: 'missing-rust-target.tgz',
              tarballPath: '.pipeline/build/rust/tarballs/missing-rust-target.tgz',
              version: '0.0.15',
            },
          ],
          packageHashAugmentations: {},
          preparedPackageJsonOverrides: {},
        },
        'different-cache-key',
      ),
      false,
    )

    assert.equal(
      canReuseRustBuildRegistryArtifacts(
        {
          cacheKey: 'rust-cache-key',
          generatedPackages: [
            {
              hash: 'generated-hash',
              internalDependencies: [],
              name: '@reference-ui/rust-darwin-arm64',
              sourceDir: 'packages/reference-rs/npm/darwin-arm64',
              tarballFileName: 'missing-rust-target.tgz',
              tarballPath: '.pipeline/build/rust/tarballs/missing-rust-target.tgz',
              version: '0.0.15',
            },
          ],
          packageHashAugmentations: {},
          preparedPackageJsonOverrides: {},
        },
        'rust-cache-key',
      ),
      false,
    )
  })
})