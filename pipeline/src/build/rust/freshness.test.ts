import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'

import { REQUIRED_REFERENCE_NATIVE_BINARY_MARKERS } from '../../../../packages/reference-rs/modules/runtime/js/shared/native-contract.js'
import { hashNativeInputs } from '../../../../packages/reference-rs/modules/runtime/js/shared/native-inputs.js'
import {
  canBuildReferenceRustTargetHere,
  formatLeftOutReferenceRustTargetWarning,
  formatUnbuildableReferenceRustTargetsError,
  getNativelyBuildableReferenceRustTargets,
  resolveReferenceRustTargetFreshnessAction,
  resolveReferenceRustTargetRequirement,
  shouldBuildLinuxReferenceRustTargetWithDagger,
} from './planning.js'
import { createRustBuildRegistryArtifactsCacheKey, rustGeneratedTarballsDirFor } from './state.js'
import {
  adoptArtifactStamps,
  classifyReferenceRustTargetPackage,
  getMissingLocalReleaseRustTargets,
} from './targets.js'

const LINUX_PACKAGE = '@reference-ui/rust-linux-x64-gnu'
const CURRENT_HASH = 'a'.repeat(64)
const OTHER_HASH = 'b'.repeat(64)
const compatibleBinary = Buffer.from([...REQUIRED_REFERENCE_NATIVE_BINARY_MARKERS].join('\0'))

const scratchDirs: string[] = []

function makeScratchDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'reference-ui-native-freshness-'))
  scratchDirs.push(dir)
  return dir
}

function writeLinuxBinaryAndStamp(dir: string, stamp: string | null, contents: Buffer = compatibleBinary): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'reference-native.linux-x64-gnu.node'), contents)
  if (stamp !== null) {
    writeFileSync(join(dir, 'reference-native.linux-x64-gnu.inputs.sha256'), `${stamp}\n`)
  }
}

/** A downloaded artifact as `pnpm run artifacts` lays it out: bindings-<rust target>/ holds binary and stamp. */
function writeArtifact(
  packageDir: string,
  rustTarget: string,
  triple: string,
  stamp: string | null,
): void {
  const dir = join(packageDir, 'dist', 'artifacts', `bindings-${rustTarget}`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `reference-native.${triple}.node`), compatibleBinary)
  if (stamp !== null) {
    writeFileSync(join(dir, `reference-native.${triple}.inputs.sha256`), `${stamp}\n`)
  }
}

after(() => {
  for (const dir of scratchDirs) {
    rmSync(dir, { force: true, recursive: true })
  }
})

describe('classifyReferenceRustTargetPackage', () => {
  it('reports a binary whose stamp matches the current sources as fresh', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, CURRENT_HASH)

    assert.equal(classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH), 'fresh')
  })

  it('reports a binary stamped for other sources as stale', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, OTHER_HASH)

    assert.equal(classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH), 'stale')
  })

  it('reports an unstamped binary as stale even when its contract markers pass', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, null)

    assert.equal(classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH), 'stale')
  })

  it('reports a stamped binary that fails the contract check as stale', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, CURRENT_HASH, Buffer.from('getNativeCapabilities'))

    assert.equal(classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH), 'stale')
  })

  it('reports a directory without a binary as missing', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, CURRENT_HASH)
    rmSync(join(dir, 'reference-native.linux-x64-gnu.node'))

    assert.equal(classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH), 'missing')
  })
})

describe('adoptArtifactStamps', () => {
  it('carries a downloaded stamp with its binary and drops the old stamp when none is downloaded', async () => {
    const packageDir = makeScratchDir()
    const linuxNpm = join(packageDir, 'dist', 'npm', 'linux-x64-gnu')
    const darwinNpm = join(packageDir, 'dist', 'npm', 'darwin-x64')
    mkdirSync(linuxNpm, { recursive: true })
    mkdirSync(darwinNpm, { recursive: true })
    writeArtifact(packageDir, 'x86_64-unknown-linux-gnu', 'linux-x64-gnu', CURRENT_HASH)
    writeArtifact(packageDir, 'x86_64-apple-darwin', 'darwin-x64', null)
    writeFileSync(join(linuxNpm, 'reference-native.linux-x64-gnu.inputs.sha256'), `${OTHER_HASH}\n`)
    writeFileSync(join(darwinNpm, 'reference-native.darwin-x64.inputs.sha256'), `${CURRENT_HASH}\n`)

    await adoptArtifactStamps(packageDir)

    assert.equal(
      readFileSync(join(linuxNpm, 'reference-native.linux-x64-gnu.inputs.sha256'), 'utf8').trim(),
      CURRENT_HASH,
    )
    assert.equal(existsSync(join(darwinNpm, 'reference-native.darwin-x64.inputs.sha256')), false)
  })
})

describe('getMissingLocalReleaseRustTargets', () => {
  it('counts a cross target this host cannot build as missing until a stamped artifact is present', () => {
    const packageDir = makeScratchDir()
    const hash = hashNativeInputs(packageDir)

    assert.deepEqual(getMissingLocalReleaseRustTargets(packageDir, undefined, 'darwin-x64'), [
      'darwin-arm64',
      'win32-x64-msvc',
    ])

    writeArtifact(packageDir, 'aarch64-apple-darwin', 'darwin-arm64', hash)
    assert.deepEqual(getMissingLocalReleaseRustTargets(packageDir, undefined, 'darwin-x64'), [
      'win32-x64-msvc',
    ])

    writeArtifact(packageDir, 'x86_64-pc-windows-msvc', 'win32-x64-msvc', null)
    assert.deepEqual(getMissingLocalReleaseRustTargets(packageDir, undefined, 'darwin-x64'), [
      'win32-x64-msvc',
    ], 'an unstamped artifact does not count as available')
  })

  it('never counts an artifact stamped for other sources as available', () => {
    const packageDir = makeScratchDir()
    writeArtifact(packageDir, 'aarch64-apple-darwin', 'darwin-arm64', OTHER_HASH)

    assert.ok(getMissingLocalReleaseRustTargets(packageDir, undefined, 'darwin-x64').includes('darwin-arm64'))
  })
})

describe('getNativelyBuildableReferenceRustTargets', () => {
  it('returns the host triple and linux, never the other cross targets', () => {
    assert.deepEqual(getNativelyBuildableReferenceRustTargets('darwin-x64'), ['darwin-x64', 'linux-x64-gnu'])
    assert.deepEqual(getNativelyBuildableReferenceRustTargets('darwin-arm64'), ['darwin-arm64', 'linux-x64-gnu'])
    assert.deepEqual(getNativelyBuildableReferenceRustTargets(null), ['linux-x64-gnu'])
  })
})

describe('resolveReferenceRustTargetRequirement', () => {
  it('is soft for the implicit all-target default and hard for a release', () => {
    assert.equal(
      resolveReferenceRustTargetRequirement({ forceBuild: false, target: 'darwin-arm64' }),
      'soft',
    )
    assert.equal(
      resolveReferenceRustTargetRequirement({ forceBuild: true, target: 'darwin-arm64' }),
      'hard',
    )
  })

  it('is hard for targets named by an explicit list and none for the rest', () => {
    assert.equal(
      resolveReferenceRustTargetRequirement({
        forceBuild: false,
        requiredTargets: ['linux-x64-gnu'],
        target: 'linux-x64-gnu',
      }),
      'hard',
    )
    assert.equal(
      resolveReferenceRustTargetRequirement({
        forceBuild: false,
        requiredTargets: ['linux-x64-gnu'],
        target: 'darwin-arm64',
      }),
      'none',
    )
    assert.equal(
      resolveReferenceRustTargetRequirement({
        forceBuild: false,
        requiredTargets: ['darwin-arm64'],
        target: 'darwin-arm64',
      }),
      'hard',
    )
  })
})

describe('linux Dagger build decision', () => {
  const linuxRequired = ['linux-x64-gnu'] as const

  it('plans a Dagger rebuild when the linux binary is stale', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, OTHER_HASH)
    const targetPackage = {
      hasLocalBinary: classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH) === 'fresh',
      name: LINUX_PACKAGE,
    }

    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: false,
        publishedOnNpm: false,
        requiredTargets: [...linuxRequired],
        targetPackage,
      }),
      true,
    )
  })

  it('reuses the linux binary when its stamp matches the current sources', () => {
    const dir = makeScratchDir()
    writeLinuxBinaryAndStamp(dir, CURRENT_HASH)
    const targetPackage = {
      hasLocalBinary: classifyReferenceRustTargetPackage(dir, LINUX_PACKAGE, CURRENT_HASH) === 'fresh',
      name: LINUX_PACKAGE,
    }

    assert.equal(
      shouldBuildLinuxReferenceRustTargetWithDagger({
        forceBuild: false,
        publishedOnNpm: false,
        requiredTargets: [...linuxRequired],
        targetPackage,
      }),
      false,
    )
  })
})

describe('resolveReferenceRustTargetFreshnessAction', () => {
  it('uses a fresh local binary whatever the requirement', () => {
    for (const requirement of ['hard', 'soft', 'none'] as const) {
      assert.equal(
        resolveReferenceRustTargetFreshnessAction({
          buildableHere: false, forceBuild: false, requirement, state: 'fresh',
        }),
        'use-local-binary',
      )
    }
  })

  it('rebuilds a stale or missing target this host can build when it is needed', () => {
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: true, forceBuild: false, requirement: 'hard', state: 'stale',
      }),
      'rebuild-here',
    )
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: true, forceBuild: false, requirement: 'soft', state: 'stale',
      }),
      'rebuild-here',
    )
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: true, forceBuild: false, requirement: 'soft', state: 'missing',
      }),
      'rebuild-here',
    )
  })

  it('refuses a stale target named by an explicit list that this host cannot build', () => {
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: false, forceBuild: false, requirement: 'hard', state: 'stale',
      }),
      'fail-unbuildable',
    )
  })

  it('leaves out a stale implicit target this host cannot build, without refusing the pack', () => {
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: false, forceBuild: false, requirement: 'soft', state: 'stale',
      }),
      'skip-stale',
    )
  })

  it('refuses a release of a required target this host cannot build, even with no binary', () => {
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: false, forceBuild: true, requirement: 'hard', state: 'missing',
      }),
      'fail-unbuildable',
    )
  })

  it('falls back to a cached or published tarball for a missing target this host cannot build', () => {
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: false, forceBuild: false, requirement: 'hard', state: 'missing',
      }),
      'fallback',
    )
    assert.equal(
      resolveReferenceRustTargetFreshnessAction({
        buildableHere: false, forceBuild: false, requirement: 'soft', state: 'missing',
      }),
      'fallback',
    )
  })

  it('never refuses or packs a target outside the explicit list when it is stale', () => {
    for (const buildableHere of [true, false]) {
      assert.equal(
        resolveReferenceRustTargetFreshnessAction({
          buildableHere, forceBuild: false, requirement: 'none', state: 'stale',
        }),
        'skip-stale',
      )
    }
  })
})

describe('formatLeftOutReferenceRustTargetWarning', () => {
  it('names the stamp command for a stale implicit target this host cannot build', () => {
    const message = formatLeftOutReferenceRustTargetWarning({
      buildableHere: false,
      hostTarget: 'darwin-x64',
      packageName: '@reference-ui/rust-darwin-arm64',
      packageVersion: '0.0.42',
      state: 'stale',
      target: 'darwin-arm64',
    })

    assert.match(
      message,
      /^Leaving @reference-ui\/rust-darwin-arm64@0\.0\.42 out of this pack: its darwin-arm64 binary is stale or unstamped and this host \(darwin-x64\) cannot build darwin-arm64\./,
    )
    assert.match(message, /write-native-stamp -- darwin-arm64` there,/)
    assert.match(message, /reference-native\.darwin-arm64\.inputs\.sha256 from its dist\/native into packages\/reference-rs\/dist\/artifacts\/bindings-aarch64-apple-darwin\/ on this machine\.$/)
    assert.doesNotMatch(message, /cross-compile/)
  })

  it('says a missing binary has no cached or published fallback here', () => {
    const message = formatLeftOutReferenceRustTargetWarning({
      buildableHere: false,
      hostTarget: 'darwin-x64',
      packageName: '@reference-ui/rust-win32-x64-msvc',
      packageVersion: '0.0.42',
      state: 'missing',
      target: 'win32-x64-msvc',
    })

    assert.match(message, /binary is missing and this host \(darwin-x64\) cannot build win32-x64-msvc, and no cached or published tarball is available\./)
    assert.match(message, /write-native-stamp -- win32-x64-msvc`/)
    assert.match(message, /dist\/artifacts\/bindings-x86_64-pc-windows-msvc\//)
  })

  it('says an unnamed stale target on a host that could build it was not named by the run', () => {
    const message = formatLeftOutReferenceRustTargetWarning({
      buildableHere: true,
      hostTarget: 'darwin-x64',
      packageName: '@reference-ui/rust-darwin-x64',
      packageVersion: '0.0.42',
      state: 'stale',
      target: 'darwin-x64',
    })

    assert.match(message, /and this run does not name darwin-x64\./)
    assert.match(message, /name darwin-x64 in the target list so this host rebuilds it\.$/)
    assert.doesNotMatch(message, /write-native-stamp/)
  })
})

describe('canBuildReferenceRustTargetHere', () => {
  it('builds the host triple natively and linux in Dagger, never other cross targets', () => {
    assert.equal(canBuildReferenceRustTargetHere('darwin-x64', 'darwin-x64'), true)
    assert.equal(canBuildReferenceRustTargetHere('linux-x64-gnu', 'darwin-x64'), true)
    assert.equal(canBuildReferenceRustTargetHere('darwin-arm64', 'darwin-x64'), false)
    assert.equal(canBuildReferenceRustTargetHere('win32-x64-msvc', 'darwin-x64'), false)
    assert.equal(canBuildReferenceRustTargetHere('darwin-arm64', 'darwin-arm64'), true)
  })
})

describe('formatUnbuildableReferenceRustTargetsError', () => {
  it('names each target and the command that refreshes it, without suggesting a cross-build', () => {
    const message = formatUnbuildableReferenceRustTargetsError(CURRENT_HASH, [
      {
        forceBuild: false,
        hostTarget: 'darwin-x64',
        packageName: '@reference-ui/rust-darwin-arm64',
        packageVersion: '0.0.42',
        state: 'stale',
        target: 'darwin-arm64',
      },
    ])

    assert.match(message, /^Refusing to pack @reference-ui\/rust/)
    assert.match(message, /@reference-ui\/rust-darwin-arm64@0\.0\.42: the darwin-arm64 binary is stale or unstamped/)
    assert.match(message, /this host \(darwin-x64\) cannot build darwin-arm64/)
    assert.match(message, /write-native-stamp -- darwin-arm64`/)
    assert.match(message, /dist\/artifacts\/bindings-aarch64-apple-darwin\//)
    assert.doesNotMatch(message, /cross-compile/)
  })
})

describe('native-input keyed caches', () => {
  it('changes the registry artifacts cache key when the native inputs hash changes', () => {
    assert.notEqual(
      createRustBuildRegistryArtifactsCacheKey('rust-hash', undefined, false, CURRENT_HASH),
      createRustBuildRegistryArtifactsCacheKey('rust-hash', undefined, false, OTHER_HASH),
    )
    assert.notEqual(
      createRustBuildRegistryArtifactsCacheKey('rust-hash', undefined, false),
      createRustBuildRegistryArtifactsCacheKey('rust-hash', undefined, false, CURRENT_HASH),
    )
  })

  it('keeps generated tarballs under the inputs hash they were packed for', () => {
    assert.notEqual(rustGeneratedTarballsDirFor(CURRENT_HASH), rustGeneratedTarballsDirFor(OTHER_HASH))
  })
})
