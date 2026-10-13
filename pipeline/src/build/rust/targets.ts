/**
 * napi-rs target package preparation for the build pipeline.
 *
 * This file owns the Rust-specific mechanics: generating `npm/*` package dirs,
 * copying local artifacts into them when available, and materializing publish-
 * style tarballs for each platform package.
 */

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, rm } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { dag, type Platform } from '@dagger.io/dagger'
import * as dagger from '@dagger.io/dagger'

import { MANAGED_NODE_IMAGE, MANAGED_PNPM_VERSION } from '../../../dependencies.js'
import type { BuildRegistryArtifactPackage } from '../types.js'
import { failStep, finishStep, logSkip, logWarning, startStep } from '../../lib/log/index.js'
import { ensureContainerRuntime } from '../../lib/runtime/ensure-container-runtime.js'
import { repoRoot, run } from '../workspace.js'
import { rustGeneratedTarballsDirFor, rustGeneratedTarballsRootDir } from './state.js'
import {
  hasCompatibleReferenceRustBinaryContents,
  isReferenceRustBinaryCompatible,
} from './compatibility.js'
import { getReferenceRustTargetPackageValidationErrors } from './package-metadata.js'
import {
  canBuildReferenceRustTargetHere,
  findMissingRequiredReferenceRustTargets,
  formatLeftOutReferenceRustTargetWarning,
  formatUnbuildableReferenceRustTargetsError,
  getNativelyBuildableReferenceRustTargets,
  resolveLocalReferenceRustTargetBuildStrategy,
  resolveReferenceRustTargetFreshnessAction,
  resolveReferenceRustTargetRequirement,
  resolveReferenceRustTargetTarballStrategy,
  shouldBuildLinuxReferenceRustTargetWithDagger,
  type ReferenceRustBinaryState,
  type ReferenceRustTargetFreshnessAction,
  type RustTargetTarballStrategy,
  type UnbuildableReferenceRustTarget,
} from './planning.js'
import {
  getRustTarget,
  getReferenceNativeTriple,
  getReferenceNativePackageName,
  SUPPORTED_REFERENCE_NATIVE_TARGETS,
  type ReferenceNativeTarget,
} from '../../../../packages/reference-rs/modules/runtime/js/shared/targets.js'
import {
  hashNativeInputs,
  nativeBinaryFileName,
  nativeStampFileName,
} from '../../../../packages/reference-rs/modules/runtime/js/shared/native-inputs.js'
import {
  collectNativeFreshnessIssues,
  writeNativeStamp,
} from '../../../../packages/reference-rs/modules/runtime/js/shared/native-freshness.js'

export const REFERENCE_RUST_PACKAGE_NAME = '@reference-ui/rust'

export {
  hasCompatibleReferenceRustBinaryContents,
  isReferenceRustBinaryCompatible,
} from './compatibility.js'
export {
  createReferenceRustPackageJsonOverride,
  getReferenceRustTargetPackageValidationErrors,
} from './package-metadata.js'
export {
  findMissingRequiredReferenceRustTargets,
  getLocallyBuildableReferenceRustTargets,
  resolveLocalReferenceRustTargetBuildStrategy,
  resolveReferenceRustTargetTarballStrategy,
  shouldBuildLinuxReferenceRustTargetWithDagger,
} from './planning.js'
export type {
  LocalReferenceRustTargetBuildStrategy,
  RustTargetTarballStrategy,
} from './planning.js'

interface ReferenceRustTargetPackage {
  binaryState: ReferenceRustBinaryState
  dir: string
  /** True only when the binary is fresh: stamped for the current Rust sources. */
  hasLocalBinary: boolean
  name: string
  version: string
}

interface RustTargetPackageJson {
  name: string
  version: string
}

interface RustTargetTarballPlan {
  strategy: RustTargetTarballStrategy
  tarballFileName: string
  tarballPath: string
}

export const repoSourceExcludes = [
  '.git',
  // Agent/session scratch (incl. foreign .muse/worktrees checkouts):
  // never referenced by the container build; sinking it into the
  // snapshot exhausts engine disk (HERMETIC-RED-2 ENOSPC).
  '.muse',
  '**/node_modules',
  '**/.turbo',
  '**/.pnpm-store',
  '.pipeline',
  'target',
  // Cargo target dirs and package build outputs at any depth. The
  // container build compiles from sources and mounts a cache volume at
  // packages/reference-rs/dist/cargo, so host build trees must not ride
  // the snapshot: packages/reference-rs/dist alone holds the ~47G cargo
  // target dir (dist/cargo/debug/incremental) that exhausted the 100GiB
  // colima disk mid-run (copy_file_range ENOSPC). No dist/ or target/
  // content is checked in, so these cannot starve the container build.
  '**/target',
  '**/dist',
  'packages/reference-docs/dist',
  'pipeline/node_modules',
  // Repo-root scratch and report dirs: same story, never read by the build.
  '.complexity-temp',
  '.playwright-mcp',
  '.reference-ui',
] as const

interface EnsureReferenceRustGeneratedPackagesOptions {
  forceBuildNativeTargets?: boolean
  hostTarget: ReferenceNativeTarget | null
  inputsHash: string
  /** The caller's explicit target list; undefined means the implicit all-target default. */
  requiredTargets?: readonly ReferenceNativeTarget[]
}

interface MaterializeReferenceRustTargetTarballsOptions {
  forceBuildNativeTargets?: boolean
  /** The sources hash the caller keyed its cache on; hashed here when the caller has none. */
  inputsHash?: string
  requiredTargets?: readonly ReferenceNativeTarget[]
}

export interface MaterializedRustTargetTarballs {
  generatedPackages: BuildRegistryArtifactPackage[]
  /** The same warnings the run logged, kept so reusing the artifacts can repeat them. */
  leftOutWarnings: string[]
}

function referenceRustArtifactsDir(packageDir: string): string {
  return resolve(packageDir, 'dist', 'artifacts')
}

function referenceRustNpmDir(packageDir: string): string {
  return resolve(packageDir, 'dist', 'npm')
}

function referenceRustNativeDir(packageDir: string): string {
  return resolve(packageDir, 'dist', 'native')
}

function packedTarballName(name: string, version: string): string {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}

function hashTarballContents(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function isPublishedOnNpm(name: string, version: string): boolean {
  try {
    const output = execFileSync('npm', ['view', `${name}@${version}`, 'version', '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    return output.length > 0
  } catch {
    return false
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function resolveReferenceRustTargetFromPackageName(packageName: string): ReferenceNativeTarget | null {
  return SUPPORTED_REFERENCE_NATIVE_TARGETS.find(
    target => getReferenceNativePackageName(target) === packageName,
  ) ?? null
}

function resolveReferenceRustTargetBinaryPath(targetDir: string, target: ReferenceNativeTarget): string {
  return resolve(targetDir, `reference-native.${target}.node`)
}

/**
 * Classifies one target package dir against the current inputs hash. The stamp
 * sits beside the binary and is copied with it, so a stale copy cannot pass as
 * fresh. A fresh stamp still has to pass the native contract check.
 */
export function classifyReferenceRustTargetPackage(
  targetDir: string,
  packageName: string,
  inputsHash: string,
): ReferenceRustBinaryState {
  const target = resolveReferenceRustTargetFromPackageName(packageName)

  if (!target) {
    // The stamp cannot be checked for an unknown package, so any binary is untrusted.
    return readdirSync(targetDir, { withFileTypes: true }).some(
      entry => entry.isFile() && entry.name.endsWith('.node')
    ) ? 'stale' : 'missing'
  }

  const report = collectNativeFreshnessIssues({
    nativeDirPath: targetDir,
    rustTargets: [getRustTarget(target)],
    currentHash: inputsHash,
  })

  if (report.missing.length > 0) {
    return 'missing'
  }

  if (report.issues.length > 0) {
    return 'stale'
  }

  return isReferenceRustBinaryCompatible({
    binaryPath: resolveReferenceRustTargetBinaryPath(targetDir, target),
    target,
  }) ? 'fresh' : 'stale'
}

function listReferenceRustTargetPackages(
  packageDir: string,
  inputsHash: string,
): ReferenceRustTargetPackage[] {
  const npmDir = referenceRustNpmDir(packageDir)
  if (!existsSync(npmDir)) {
    return []
  }

  return readdirSync(npmDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map((entry) => {
      const dir = join(npmDir, entry.name)
      const packageJson = readJson<RustTargetPackageJson>(join(dir, 'package.json'))
      const binaryState = classifyReferenceRustTargetPackage(dir, packageJson.name, inputsHash)

      return {
        binaryState,
        dir,
        hasLocalBinary: binaryState === 'fresh',
        name: packageJson.name,
        version: packageJson.version,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

/** Copies a binary with its inputs stamp so the target copy keeps its freshness claim. */
async function copyNativeBinaryAndStamp(
  nativeDir: string,
  targetDir: string,
  target: ReferenceNativeTarget,
): Promise<void> {
  await copyFile(resolve(nativeDir, nativeBinaryFileName(target)), resolve(targetDir, nativeBinaryFileName(target)))
  await copyFile(resolve(nativeDir, nativeStampFileName(target)), resolve(targetDir, nativeStampFileName(target)))
}

/**
 * `pnpm run artifacts` overwrites each target binary with the downloaded one.
 * A stamp downloaded beside it travels with it; without one, the old stamp is
 * dropped so the copy reads as stale rather than fresh.
 */
export async function adoptArtifactStamps(packageDir: string): Promise<void> {
  for (const target of SUPPORTED_REFERENCE_NATIVE_TARGETS) {
    if (!hasDownloadedReferenceRustArtifact(packageDir, target)) {
      continue
    }

    const stampName = nativeStampFileName(target)
    const targetStampPath = resolve(referenceRustNpmDir(packageDir), target, stampName)
    const artifactStampPath = resolve(
      referenceRustArtifactsDir(packageDir),
      `bindings-${getRustTarget(target)}`,
      stampName,
    )

    if (existsSync(artifactStampPath)) {
      await copyFile(artifactStampPath, targetStampPath)
    } else {
      await rm(targetStampPath, { force: true })
    }
  }
}

function readReferenceRustRootVersion(packageDir: string): string {
  return readJson<RustTargetPackageJson>(join(packageDir, 'package.json')).version
}

async function stageLocalReferenceRustBinaryIntoTargetPackage(
  packageDir: string,
  targetPackages: readonly ReferenceRustTargetPackage[],
  inputsHash: string,
): Promise<void> {
  const triple = getReferenceNativeTriple()

  if (!triple) {
    return
  }

  const targetPackageName = getReferenceNativePackageName(triple)
  const targetPackage = targetPackages.find(pkg => pkg.name === targetPackageName)

  if (!targetPackage) {
    return
  }

  // Only a fresh host binary is staged. A stale one would be packed as current.
  const hostReport = collectNativeFreshnessIssues({
    nativeDirPath: referenceRustNativeDir(packageDir),
    rustTargets: [getRustTarget(triple)],
    currentHash: inputsHash,
  })
  if (!hostReport.verified.includes(triple)) {
    return
  }

  await copyNativeBinaryAndStamp(referenceRustNativeDir(packageDir), targetPackage.dir, triple)
}

async function removeReferenceRustTargetPackageBinaries(
  targetPackages: readonly ReferenceRustTargetPackage[],
  requiredTargets: readonly ReferenceNativeTarget[],
): Promise<void> {
  const requiredTargetPackageNames = new Set<string>(
    requiredTargets.map((target) => getReferenceNativePackageName(target)),
  )

  for (const targetPackage of targetPackages) {
    if (!requiredTargetPackageNames.has(targetPackage.name)) {
      continue
    }

    for (const entry of readdirSync(targetPackage.dir, { withFileTypes: true })) {
      if (entry.isFile() && (entry.name.endsWith('.node') || entry.name.endsWith('.inputs.sha256'))) {
        await rm(resolve(targetPackage.dir, entry.name), { force: true })
      }
    }
  }
}

function repoSource() {
  return dag.host().directory(repoRoot, {
    exclude: [...repoSourceExcludes],
  })
}

/**
 * Builds the linux binary in Dagger and stamps it with `inputsHash`, which the
 * caller captured before the build. Hashing after the compile could stamp sources
 * the binary was not built from if a file changed mid-build.
 */
async function buildLinuxReferenceRustBinaryWithDagger(packageDir: string, inputsHash: string): Promise<void> {
  const triple: ReferenceNativeTarget = 'linux-x64-gnu'
  const rustTarget = getRustTarget(triple)
  const outputPathInContainer = `/workspace/packages/reference-rs/dist/native/reference-native.${triple}.node`
  const outputPathOnHost = resolve(packageDir, 'dist', 'native', `reference-native.${triple}.node`)

  const runBuild = async () => {
    const pnpmStore = dag.cacheVolume('reference-ui-rust-linux-pnpm-store')
    const cargoHome = dag.cacheVolume('reference-ui-rust-linux-cargo-home')
    const rustupHome = dag.cacheVolume('reference-ui-rust-linux-rustup-home')
    const cargoTarget = dag.cacheVolume('reference-ui-rust-linux-cargo-target')

    const container = dag
      .container({ platform: 'linux/amd64' as Platform })
      .from(MANAGED_NODE_IMAGE)
      .withDirectory('/workspace', repoSource())
      .withMountedCache('/pnpm/store', pnpmStore)
      .withMountedCache('/root/.cargo', cargoHome)
      .withMountedCache('/root/.rustup', rustupHome)
      .withMountedCache('/workspace/packages/reference-rs/dist/cargo', cargoTarget)
      .withEnvVariable('CI', '1')
      .withEnvVariable('NO_COLOR', '1')
      .withEnvVariable('PNPM_STORE_DIR', '/pnpm/store')
      .withWorkdir('/workspace')
      .withExec(['apt-get', 'update'])
      .withExec([
        'apt-get',
        'install',
        '-y',
        'build-essential',
        'ca-certificates',
        'curl',
        'pkg-config',
        'python3',
      ])
      .withExec(['corepack', 'enable'])
      .withExec(['corepack', 'prepare', `pnpm@${MANAGED_PNPM_VERSION}`, '--activate'])
      .withExec([
        'bash',
        '-lc',
        'if [ ! -x /root/.cargo/bin/rustup ]; then curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal; fi',
      ])
      .withExec([
        'bash',
        '-lc',
        `export PATH=/root/.cargo/bin:$PATH && rustup target add ${rustTarget}`,
      ])
      .withExec([
        'pnpm',
        'install',
        '--ignore-scripts',
        '--no-frozen-lockfile',
        '--filter',
        '@reference-ui/rust...',
      ])
      .withExec([
        'bash',
        '-lc',
        `export PATH=/root/.cargo/bin:$PATH && pnpm --filter @reference-ui/rust exec napi build --package reference-native --platform --release --target ${rustTarget} --output-dir dist/native --no-js`,
      ])

    await container.file(outputPathInContainer).export(outputPathOnHost)
  }

  await rm(resolve(referenceRustNativeDir(packageDir), nativeStampFileName(triple)), { force: true })

  try {
    dag.getGQLClient()
    await runBuild()
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('GraphQL client is not set')) {
      throw error
    }

    ensureContainerRuntime()
    await dagger.connection(runBuild, { LogOutput: process.stdout })
  }

  writeNativeStamp({
    nativeDirPath: referenceRustNativeDir(packageDir),
    packageDirPath: packageDir,
    triple,
    inputsHash,
  })
}

function hasDownloadedReferenceRustArtifact(packageDir: string, target: ReferenceNativeTarget): boolean {
  return existsSync(
    resolve(packageDir, 'dist', 'artifacts', `bindings-${getRustTarget(target)}`, `reference-native.${target}.node`),
  )
}

async function ensureReferenceRustTargetInstalled(target: ReferenceNativeTarget): Promise<void> {
  await run('rustup', ['target', 'add', getRustTarget(target)], {
    label: `Install Rust target ${target}`,
  })
}

function referenceRustBuiltBinaryPath(packageDir: string, target: ReferenceNativeTarget): string {
  return resolve(packageDir, 'dist', 'native', `reference-native.${target}.node`)
}

function referenceRustCargoTargetDir(packageDir: string, target: ReferenceNativeTarget): string {
  return resolve(packageDir, 'dist', 'cargo', getRustTarget(target))
}

async function removeReferenceRustBuiltBinaryOutputs(
  packageDir: string,
  target: ReferenceNativeTarget,
): Promise<void> {
  await rm(referenceRustBuiltBinaryPath(packageDir, target), { force: true })
  await rm(referenceRustCargoTargetDir(packageDir, target), { recursive: true, force: true })
}

/**
 * Builds the host-native binary with napi and stamps it with `inputsHash`,
 * captured before the build starts. Only the host triple is built here: the
 * pipeline does not cross-compile.
 */
async function buildReferenceRustBinaryWithNapi(
  packageDir: string,
  target: ReferenceNativeTarget,
  inputsHash: string,
): Promise<void> {
  await ensureReferenceRustTargetInstalled(target)

  const args = [
    'exec',
    'napi',
    'build',
    '--package',
    'reference-native',
    '--platform',
    '--release',
    '--target',
    getRustTarget(target),
    '--output-dir',
    'dist/native',
    '--no-js',
  ]
  const builtBinaryPath = referenceRustBuiltBinaryPath(packageDir, target)

  const runBuild = () => run('pnpm', args, {
    cwd: packageDir,
    label: `Build ${REFERENCE_RUST_PACKAGE_NAME} ${target}`,
  })

  const isBuiltBinaryCompatible = () => isReferenceRustBinaryCompatible({
    binaryPath: builtBinaryPath,
    target,
  })

  await rm(resolve(referenceRustNativeDir(packageDir), nativeStampFileName(target)), { force: true })
  await runBuild()

  if (!isBuiltBinaryCompatible()) {
    await removeReferenceRustBuiltBinaryOutputs(packageDir, target)
    await runBuild()

    if (!isBuiltBinaryCompatible()) {
      throw new Error(
        `Built ${REFERENCE_RUST_PACKAGE_NAME} ${target} binary is incompatible with the current native contract after a clean rebuild.`,
      )
    }
  }

  writeNativeStamp({
    nativeDirPath: referenceRustNativeDir(packageDir),
    packageDirPath: packageDir,
    triple: target,
    inputsHash,
  })
}

async function stageBuiltReferenceRustBinaryIntoTargetPackage(
  packageDir: string,
  targetPackage: ReferenceRustTargetPackage,
  target: ReferenceNativeTarget,
): Promise<void> {
  await copyNativeBinaryAndStamp(referenceRustNativeDir(packageDir), targetPackage.dir, target)
}

/**
 * A release may take a target from a downloaded artifact only when the artifact
 * carries a stamp matching the current sources, the same test packing applies.
 */
function hasFreshDownloadedReferenceRustArtifact(
  packageDir: string,
  target: ReferenceNativeTarget,
  inputsHash: string,
): boolean {
  const artifactDir = resolve(referenceRustArtifactsDir(packageDir), `bindings-${getRustTarget(target)}`)

  return existsSync(artifactDir)
    && classifyReferenceRustTargetPackage(artifactDir, getReferenceNativePackageName(target), inputsHash) === 'fresh'
}

/**
 * Release preflight, run before any build or pack. A target counts as available
 * only if this host can build it natively (its own triple, or linux in Dagger) or
 * a fresh artifact is present. A cross target this host cannot build is missing,
 * so the release refuses up front rather than after deleting local binaries.
 */
export function getMissingLocalReleaseRustTargets(
  packageDir: string,
  requiredTargets: readonly ReferenceNativeTarget[] = SUPPORTED_REFERENCE_NATIVE_TARGETS,
  hostTarget: ReferenceNativeTarget | null = getReferenceNativeTriple(),
): ReferenceNativeTarget[] {
  const inputsHash = hashNativeInputs(packageDir)
  const nativelyBuildableTargets = getNativelyBuildableReferenceRustTargets(hostTarget)
  const artifactTargets = requiredTargets.filter(
    (target) => hasFreshDownloadedReferenceRustArtifact(packageDir, target, inputsHash),
  )

  return findMissingRequiredReferenceRustTargets({
    artifactTargets,
    cachedTarballTargets: [],
    locallyBuildableTargets: nativelyBuildableTargets,
    publishedTargets: [],
    requiredTargets,
  })
}

async function stageRequiredContainerBuiltReferenceRustBinaries(
  packageDir: string,
  targetPackages: readonly ReferenceRustTargetPackage[],
  requiredTargets: readonly ReferenceNativeTarget[],
  forceBuild: boolean,
  inputsHash: string,
): Promise<void> {
  const targetPackageName = getReferenceNativePackageName('linux-x64-gnu')
  const targetPackage = targetPackages.find(pkg => pkg.name === targetPackageName)

  const publishedOnNpm = targetPackage ? isPublishedOnNpm(targetPackage.name, targetPackage.version) : false

  if (!shouldBuildLinuxReferenceRustTargetWithDagger({
    forceBuild,
    publishedOnNpm,
    requiredTargets,
    targetPackage,
  })) {
    return
  }

  if (!targetPackage) {
    return
  }

  const buildLabel = `Build ${REFERENCE_RUST_PACKAGE_NAME} linux-x64-gnu in Dagger (${targetPackage.binaryState} binary)`
  const step = startStep(buildLabel)

  try {
    await buildLinuxReferenceRustBinaryWithDagger(packageDir, inputsHash)
  } catch (error) {
    failStep(step, buildLabel)
    throw error
  }

  finishStep(step, `${buildLabel} stamped for current sources`)
  await copyNativeBinaryAndStamp(referenceRustNativeDir(packageDir), targetPackage.dir, 'linux-x64-gnu')
}

/**
 * Rebuilds required host-native targets whose binary is not fresh. Cross
 * targets get no build step: a stale one is refused in
 * `assertRequiredTargetsCanBeProduced`, and an optional one is left out.
 */
async function stageRequiredLocallyBuiltReferenceRustBinaries(
  packageDir: string,
  targetPackages: readonly ReferenceRustTargetPackage[],
  requiredTargets: readonly ReferenceNativeTarget[],
  forceBuild: boolean,
  inputsHash: string,
): Promise<void> {
  const requiredTargetPackageNames = new Set<string>(
    requiredTargets.map((target) => getReferenceNativePackageName(target)),
  )

  for (const targetPackage of targetPackages) {
    if ((!forceBuild && targetPackage.hasLocalBinary) || !requiredTargetPackageNames.has(targetPackage.name)) {
      continue
    }

    const target = resolveReferenceRustTargetFromPackageName(targetPackage.name)

    if (!target) {
      continue
    }

    switch (resolveLocalReferenceRustTargetBuildStrategy({ target })) {
      case 'reuse-host-binary':
        await buildReferenceRustBinaryWithNapi(packageDir, target, inputsHash)
        await stageBuiltReferenceRustBinaryIntoTargetPackage(packageDir, targetPackage, target)
        break

      case 'build-darwin-cross-target':
      case 'build-windows-cross-target':
      case 'build-linux-with-dagger':
      case 'unavailable':
        break
    }
  }
}

function planReferenceRustTargetTarball(
  targetPackage: ReferenceRustTargetPackage,
  allowRemoteFallback: boolean,
  inputsHash: string,
): RustTargetTarballPlan {
  const tarballFileName = packedTarballName(targetPackage.name, targetPackage.version)
  const tarballPath = resolve(rustGeneratedTarballsDirFor(inputsHash), tarballFileName)
  const tarballExists = existsSync(tarballPath)
  const target = resolveReferenceRustTargetFromPackageName(targetPackage.name)
  const hasCompatibleCachedTarball = tarballExists && target !== null
    ? hasCompatibleReferenceRustTargetTarball(tarballPath, target)
    : false

  return {
    strategy: resolveReferenceRustTargetTarballStrategy({
      allowRemoteFallback,
      hasLocalBinary: targetPackage.hasLocalBinary,
      publishedOnNpm:
        !targetPackage.hasLocalBinary && !hasCompatibleCachedTarball
          ? isPublishedOnNpm(targetPackage.name, targetPackage.version)
          : false,
      tarballExists: hasCompatibleCachedTarball,
    }),
    tarballFileName,
    tarballPath,
  }
}

function hasCompatibleReferenceRustTargetTarball(
  tarballPath: string,
  target: ReferenceNativeTarget,
): boolean {
  try {
    const tarballContents = execFileSync(
      'tar',
      ['-xOf', tarballPath, `package/reference-native.${target}.node`],
      {
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    )

    return hasCompatibleReferenceRustBinaryContents(tarballContents)
  } catch {
    return false
  }
}

async function executeReferenceRustTargetTarballPlan(
  targetPackage: ReferenceRustTargetPackage,
  plan: RustTargetTarballPlan,
): Promise<boolean> {
  switch (plan.strategy) {
    case 'pack-local-binary':
      await rm(plan.tarballPath, { force: true })
      await run('npm', ['pack', '--pack-destination', dirname(plan.tarballPath)], {
        cwd: targetPackage.dir,
        env: {
          npm_config_ignore_scripts: 'true',
        },
        label: `Pack ${targetPackage.name}`,
      })
      return true

    case 'reuse-cached-tarball':
      logSkip(`Skipping fetch for ${targetPackage.name}; cached tarball present`)
      return true

    case 'fetch-published-tarball':
      await run('npm', ['pack', `${targetPackage.name}@${targetPackage.version}`, '--pack-destination', dirname(plan.tarballPath)], {
        cwd: repoRoot,
        env: {
          npm_config_ignore_scripts: 'true',
        },
        label: `Fetch ${targetPackage.name}`,
      })
      return true

    case 'skip-target':
      return false
  }
}

async function createGeneratedRustTargetPackage(
  targetPackage: ReferenceRustTargetPackage,
  plan: RustTargetTarballPlan,
): Promise<BuildRegistryArtifactPackage> {
  const tarball = await readFile(plan.tarballPath)

  return {
    hash: hashTarballContents(tarball),
    internalDependencies: [],
    name: targetPackage.name,
    sourceDir: relative(repoRoot, targetPackage.dir),
    tarballFileName: plan.tarballFileName,
    tarballPath: relative(repoRoot, plan.tarballPath),
    version: targetPackage.version,
  }
}

/**
 * Fails before any build when a required target would need a stale or forced
 * rebuild that this host cannot perform. A stale binary is never packed, and a
 * release never ships a partial native set.
 */
function assertRequiredTargetsCanBeProduced(
  targetPackages: readonly ReferenceRustTargetPackage[],
  options: EnsureReferenceRustGeneratedPackagesOptions & { forceBuildNativeTargets: boolean },
): void {
  const unbuildable: UnbuildableReferenceRustTarget[] = []

  for (const targetPackage of targetPackages) {
    const target = resolveReferenceRustTargetFromPackageName(targetPackage.name)

    if (!target) {
      continue
    }

    const requirement = resolveReferenceRustTargetRequirement({
      forceBuild: options.forceBuildNativeTargets,
      requiredTargets: options.requiredTargets,
      target,
    })
    const action = resolveReferenceRustTargetFreshnessAction({
      buildableHere: canBuildReferenceRustTargetHere(target, options.hostTarget),
      forceBuild: options.forceBuildNativeTargets,
      requirement,
      state: targetPackage.binaryState,
    })

    if (action === 'fail-unbuildable') {
      unbuildable.push({
        forceBuild: options.forceBuildNativeTargets,
        hostTarget: options.hostTarget,
        packageName: targetPackage.name,
        packageVersion: targetPackage.version,
        state: targetPackage.binaryState,
        target,
      })
    }
  }

  if (unbuildable.length > 0) {
    throw new Error(formatUnbuildableReferenceRustTargetsError(options.inputsHash, unbuildable))
  }
}

/** Removes tarball directories packed for other Rust sources; the current one is kept. */
async function pruneRustGeneratedTarballDirs(keepInputsHash: string): Promise<void> {
  const keepDir = rustGeneratedTarballsDirFor(keepInputsHash)
  const entries = await readdir(rustGeneratedTarballsRootDir, { withFileTypes: true }).catch(() => [])

  for (const entry of entries) {
    const entryPath = resolve(rustGeneratedTarballsRootDir, entry.name)

    if (entryPath !== keepDir) {
      await rm(entryPath, { recursive: true, force: true })
    }
  }
}

async function ensureReferenceRustGeneratedPackages(
  packageDir: string,
  options: EnsureReferenceRustGeneratedPackagesOptions,
): Promise<ReferenceRustTargetPackage[]> {
  const { forceBuildNativeTargets = false, hostTarget, inputsHash, requiredTargets: explicitTargets } = options
  // Staging rebuilds the effective set; the explicit list only decides how strictly a stale target is refused.
  const requiredTargets = explicitTargets ?? SUPPORTED_REFERENCE_NATIVE_TARGETS

  // `create-npm-dirs` defines the target package layout we inspect below.
  await run('pnpm', ['run', 'create-npm-dirs'], {
    cwd: packageDir,
    env: {
      npm_config_ignore_scripts: 'true',
    },
    label: 'Prepare @reference-ui/rust npm target dirs',
  })

  if (forceBuildNativeTargets) {
    await removeReferenceRustTargetPackageBinaries(
      listReferenceRustTargetPackages(packageDir, inputsHash),
      requiredTargets,
    )
  }

  if (existsSync(referenceRustArtifactsDir(packageDir))) {
    await run('pnpm', ['run', 'artifacts'], {
      cwd: packageDir,
      env: {
        npm_config_ignore_scripts: 'true',
      },
      label: 'Populate @reference-ui/rust npm target dirs',
    })
    await adoptArtifactStamps(packageDir)
  }

  const initialTargetPackages = listReferenceRustTargetPackages(packageDir, inputsHash)
  assertRequiredTargetsCanBeProduced(initialTargetPackages, {
    forceBuildNativeTargets,
    hostTarget,
    inputsHash,
    requiredTargets: explicitTargets,
  })

  if (!forceBuildNativeTargets) {
    await stageLocalReferenceRustBinaryIntoTargetPackage(packageDir, initialTargetPackages, inputsHash)
  }
  const targetPackagesAfterHostStaging = listReferenceRustTargetPackages(packageDir, inputsHash)
  await stageRequiredLocallyBuiltReferenceRustBinaries(
    packageDir,
    targetPackagesAfterHostStaging,
    requiredTargets,
    forceBuildNativeTargets,
    inputsHash,
  )
  const targetPackagesAfterLocalBuilds = listReferenceRustTargetPackages(packageDir, inputsHash)
  await stageRequiredContainerBuiltReferenceRustBinaries(
    packageDir,
    targetPackagesAfterLocalBuilds,
    requiredTargets,
    forceBuildNativeTargets,
    inputsHash,
  )

  const rootVersion = readReferenceRustRootVersion(packageDir)
  const targetPackages = listReferenceRustTargetPackages(packageDir, inputsHash)
  const validationErrors = getReferenceRustTargetPackageValidationErrors({
    rootVersion,
    targetPackages,
  })

  if (validationErrors.length > 0) {
    throw new Error(
      [
        `Generated native package metadata for ${REFERENCE_RUST_PACKAGE_NAME}@${rootVersion} is incomplete or inconsistent.`,
        ...validationErrors,
      ].join(' '),
    )
  }

  return targetPackages
}

export async function materializeReferenceRustTargetTarballs(
  packageDir: string,
  options: MaterializeReferenceRustTargetTarballsOptions = {},
): Promise<MaterializedRustTargetTarballs> {
  const explicitTargets = options.requiredTargets
  const forceBuildNativeTargets = options.forceBuildNativeTargets ?? false
  const inputsHash = options.inputsHash ?? hashNativeInputs(packageDir)
  const hostTarget = getReferenceNativeTriple()
  const targetPackages = await ensureReferenceRustGeneratedPackages(packageDir, {
    forceBuildNativeTargets,
    hostTarget,
    inputsHash,
    requiredTargets: explicitTargets,
  })
  const generatedPackages: BuildRegistryArtifactPackage[] = []
  const leftOutWarnings: string[] = []
  const skippedTargets: ReferenceRustTargetPackage[] = []
  const leaveOut = (warning: string): void => {
    logWarning(warning)
    leftOutWarnings.push(warning)
  }

  await mkdir(rustGeneratedTarballsDirFor(inputsHash), { recursive: true })

  for (const targetPackage of targetPackages) {
    const target = resolveReferenceRustTargetFromPackageName(targetPackage.name)
    const buildableHere = target !== null && canBuildReferenceRustTargetHere(target, hostTarget)
    const requirement = target
      ? resolveReferenceRustTargetRequirement({ forceBuild: forceBuildNativeTargets, requiredTargets: explicitTargets, target })
      : 'none'
    const action: ReferenceRustTargetFreshnessAction = target
      ? resolveReferenceRustTargetFreshnessAction({
          buildableHere,
          forceBuild: forceBuildNativeTargets,
          requirement,
          state: targetPackage.binaryState,
        })
      : 'fallback'

    if (action === 'skip-stale' && target) {
      leaveOut(formatLeftOutReferenceRustTargetWarning({
        buildableHere,
        hostTarget,
        packageName: targetPackage.name,
        packageVersion: targetPackage.version,
        state: targetPackage.binaryState === 'missing' ? 'missing' : 'stale',
        target,
      }))
      continue
    }

    if (action === 'rebuild-here' || action === 'fail-unbuildable') {
      // Staging builds or refuses every needed target before this loop; reaching here means it did neither.
      throw new Error(
        `Native package ${targetPackage.name}@${targetPackage.version} is still ${targetPackage.binaryState} after the native build step (${action}).`,
      )
    }

    const plan = planReferenceRustTargetTarball(targetPackage, !forceBuildNativeTargets, inputsHash)

    // Release builds force fresh local binaries; non-release registry staging can reuse remote tarballs.
    if (!(await executeReferenceRustTargetTarballPlan(targetPackage, plan))) {
      if (requirement === 'hard') {
        skippedTargets.push(targetPackage)
      } else if (requirement === 'soft' && target) {
        leaveOut(formatLeftOutReferenceRustTargetWarning({
          buildableHere,
          hostTarget,
          packageName: targetPackage.name,
          packageVersion: targetPackage.version,
          state: targetPackage.binaryState === 'missing' ? 'missing' : 'stale',
          target,
        }))
      }
      continue
    }

    generatedPackages.push(await createGeneratedRustTargetPackage(targetPackage, plan))
  }

  if (skippedTargets.length > 0) {
    throw new Error(
      [
        `Failed to materialize required native packages for ${REFERENCE_RUST_PACKAGE_NAME}.`,
        `Missing tarballs: ${skippedTargets.map(targetPackage => `${targetPackage.name}@${targetPackage.version}`).join(', ')}.`,
        forceBuildNativeTargets
          ? 'Each native package must be built or staged as a local binary during the release.'
          : 'Each native package must exist at the same version as @reference-ui/rust, either from a local binary, a cached tarball, or an already published npm package.',
      ].join(' '),
    )
  }

  await pruneRustGeneratedTarballDirs(inputsHash)

  return { generatedPackages, leftOutWarnings }
}