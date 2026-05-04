import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createReferenceRustPackageJsonOverride,
  findMissingRequiredReferenceRustTargets,
  getReferenceRustTargetPackageValidationErrors,
  getLocallyBuildableReferenceRustTargets,
  hasCompatibleReferenceRustBinaryContents,
  resolveLocalReferenceRustTargetBuildStrategy,
  resolveReferenceRustTargetTarballStrategy,
  shouldBuildLinuxReferenceRustTargetWithDagger,
} from './targets.js'

describe('createReferenceRustPackageJsonOverride', () => {
  it('returns undefined when there are no target packages', () => {
    assert.equal(createReferenceRustPackageJsonOverride([]), undefined)
  })

  it('maps target packages into optionalDependencies', () => {
    assert.deepEqual(
      createReferenceRustPackageJsonOverride([
        {
          name: '@reference-ui/rust-darwin-arm64',
          version: '0.0.15',
        },
        {
          name: '@reference-ui/rust-linux-x64-gnu',
          version: '0.0.15',
        },
      ]),
      {
        optionalDependencies: {
          '@reference-ui/rust-darwin-arm64': '0.0.15',
          '@reference-ui/rust-linux-x64-gnu': '0.0.15',
        },
      },
    )
  })
})

describe('resolveReferenceRustTargetTarballStrategy', () => {
  it('packs local binaries even when a cached tarball exists', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        allowRemoteFallback: true,
        hasLocalBinary: true,
        publishedOnNpm: true,
        tarballExists: true,
      }),
      'pack-local-binary',
    )
  })

  it('reuses a cached tarball when there is no local binary', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        allowRemoteFallback: true,
        hasLocalBinary: false,
        publishedOnNpm: true,
        tarballExists: true,
      }),
      'reuse-cached-tarball',
    )
  })

  it('fetches from npm when no cache exists and the target is published', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        allowRemoteFallback: true,
        hasLocalBinary: false,
        publishedOnNpm: true,
        tarballExists: false,
      }),
      'fetch-published-tarball',
    )
  })

  it('skips the target when no binary, cache, or published package is available', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        allowRemoteFallback: true,
        hasLocalBinary: false,
        publishedOnNpm: false,
        tarballExists: false,
      }),
      'skip-target',
    )
  })

  it('skips remote fallbacks when release requires freshly built native binaries', () => {
    assert.equal(
      resolveReferenceRustTargetTarballStrategy({
        allowRemoteFallback: false,
        hasLocalBinary: false,
        publishedOnNpm: true,
        tarballExists: true,
      }),
      'skip-target',
    )
  })
})

describe('hasCompatibleReferenceRustBinaryContents', () => {
  it('accepts binaries that advertise the full native API contract', () => {
    assert.equal(
      hasCompatibleReferenceRustBinaryContents(
        Buffer.from(
          [
            'getNativeCapabilities',
            'rewriteCssImports',
            'rewriteCvaImports',
            'applyResponsiveStyles',
            'scanAndEmitModules',
            'analyzeAtlas',
            'analyzeStyletrace',
            'styletraceSyncRootHint',
            'replaceFunctionNameImportFrom',
          ].join('\0'),
        ),
      ),
      true,
    )
  })

  it('rejects binaries that are missing newer required exports', () => {
    assert.equal(
      hasCompatibleReferenceRustBinaryContents(
        Buffer.from(
          [
            'getNativeCapabilities',
            'rewriteCssImports',
            'rewriteCvaImports',
            'scanAndEmitModules',
            'analyzeAtlas',
            'analyzeStyletrace',
            'styletraceSyncRootHint',
          ].join('\0'),
        ),
      ),
      false,
    )
  })
})

describe('getLocallyBuildableReferenceRustTargets', () => {
  it('returns all release targets on macOS hosts', () => {
    assert.deepEqual(
      getLocallyBuildableReferenceRustTargets('darwin-x64', 'darwin'),
      ['darwin-x64', 'darwin-arm64', 'linux-x64-gnu', 'win32-x64-msvc'],
    )
  })

  it('returns linux and windows when the host target is unavailable on non-darwin hosts', () => {
    assert.deepEqual(getLocallyBuildableReferenceRustTargets(null, 'linux'), ['linux-x64-gnu', 'win32-x64-msvc'])
  })
})

describe('resolveLocalReferenceRustTargetBuildStrategy', () => {
  it('reuses the host binary for the active target', () => {
    assert.equal(
      resolveLocalReferenceRustTargetBuildStrategy({
        hostPlatform: 'darwin',
        hostTarget: 'darwin-x64',
        target: 'darwin-x64',
      }),
      'reuse-host-binary',
    )
  })

  it('uses local darwin cross compilation for the opposite macOS arch', () => {
    assert.equal(
      resolveLocalReferenceRustTargetBuildStrategy({
        hostPlatform: 'darwin',
        hostTarget: 'darwin-x64',
        target: 'darwin-arm64',
      }),
      'build-darwin-cross-target',
    )
  })

  it('uses napi cross compilation for the windows target', () => {
    assert.equal(
      resolveLocalReferenceRustTargetBuildStrategy({
        hostPlatform: 'darwin',
        hostTarget: 'darwin-x64',
        target: 'win32-x64-msvc',
      }),
      'build-windows-cross-target',
    )
  })
})

describe('findMissingRequiredReferenceRustTargets', () => {
  it('returns only targets that are neither buildable nor otherwise available', () => {
    assert.deepEqual(
      findMissingRequiredReferenceRustTargets({
        artifactTargets: [],
        cachedTarballTargets: [],
        locallyBuildableTargets: ['darwin-x64', 'darwin-arm64', 'linux-x64-gnu', 'win32-x64-msvc'],
        publishedTargets: [],
        requiredTargets: ['darwin-x64', 'darwin-arm64', 'linux-x64-gnu', 'win32-x64-msvc'],
      }),
      [],
    )
  })
})

describe('getReferenceRustTargetPackageValidationErrors', () => {
  it('accepts a complete set of target packages aligned to the root version', () => {
    assert.deepEqual(
      getReferenceRustTargetPackageValidationErrors({
        rootVersion: '0.0.21',
        targetPackages: [
          { name: '@reference-ui/rust-darwin-arm64', version: '0.0.21' },
          { name: '@reference-ui/rust-darwin-x64', version: '0.0.21' },
          { name: '@reference-ui/rust-linux-x64-gnu', version: '0.0.21' },
          { name: '@reference-ui/rust-win32-x64-msvc', version: '0.0.21' },
        ],
      }),
      [],
    )
  })

  it('reports missing and mismatched target packages against the root version', () => {
    assert.deepEqual(
      getReferenceRustTargetPackageValidationErrors({
        rootVersion: '0.0.21',
        targetPackages: [
          { name: '@reference-ui/rust-darwin-arm64', version: '0.0.21' },
          { name: '@reference-ui/rust-darwin-x64', version: '0.0.20' },
          { name: '@reference-ui/rust-win32-x64-msvc', version: '0.0.21' },
        ],
      }),
      [
        'Generated native package @reference-ui/rust-darwin-x64@0.0.20 does not match @reference-ui/rust@0.0.21.',
        'Missing generated native package @reference-ui/rust-linux-x64-gnu@0.0.21.',
      ],
    )
  })
})

describe('shouldBuildLinuxReferenceRustTargetWithDagger', () => {
  it('returns true when linux is required and no local or published linux package is available', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: false,
        publishedOnNpm: false,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: false,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      true,
    )
  })

  it('returns false when linux is not required', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: false,
        publishedOnNpm: false,
        requiredTargets: ['darwin-x64'],
        targetPackage: {
          hasLocalBinary: false,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      false,
    )
  })

  it('returns false when the linux target already has a local binary', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: false,
        publishedOnNpm: false,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: true,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      false,
    )
  })

  it('rebuilds linux when release force-build is enabled even if a local binary exists', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: true,
        publishedOnNpm: false,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: true,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      true,
    )
  })

  it('returns true when linux is required and only a published package exists', () => {
    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: false,
        publishedOnNpm: true,
        requiredTargets: ['linux-x64-gnu'],
        targetPackage: {
          hasLocalBinary: false,
          name: '@reference-ui/rust-linux-x64-gnu',
        },
      }),
      true,
    )
  })
})