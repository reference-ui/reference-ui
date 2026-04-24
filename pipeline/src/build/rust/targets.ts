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
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { dag, type Platform } from '@dagger.io/dagger'
import * as dagger from '@dagger.io/dagger'

import type {
  BuildPackageJsonOverride,
  BuildRegistryArtifactPackage,
} from '../types.js'
import { logSkip } from '../../lib/log/index.js'
import { ensureContainerRuntime } from '../../lib/runtime/ensure-container-runtime.js'
import { repoRoot, run } from '../workspace.js'
import { rustGeneratedTarballsDir } from './state.js'
import {
  getRustTarget,
  getVirtualNativeTriple,
  getVirtualNativePackageName,
  SUPPORTED_VIRTUAL_NATIVE_TARGETS,
  type VirtualNativeTarget,
} from '../../../../packages/reference-rs/js/shared/targets.js'

export const REFERENCE_RUST_PACKAGE_NAME = '@reference-ui/rust'

export type RustTargetTarballStrategy =
  | 'pack-local-binary'
  | 'reuse-cached-tarball'
  | 'fetch-published-tarball'
  | 'skip-target'

export type LocalReferenceRustTargetBuildStrategy =
  | 'reuse-host-binary'
  | 'build-darwin-cross-target'
  | 'build-windows-cross-target'
  | 'build-linux-with-dagger'
  | 'unavailable'

interface ReferenceRustTargetPackage {
  dir: string
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

const repoSourceExcludes = [
  '.git',
  '**/node_modules',
  '**/.turbo',
  '**/.pnpm-store',
  '.pipeline',
  'target',
  'packages/reference-docs/dist',
  'packages/reference-e2e/blob-reports',
  'packages/reference-e2e/playwright-report',
  'packages/reference-e2e/test-results',
  'packages/reference-e2e/matrix-logs',
  'pipeline/node_modules',
] as const

interface ReferenceRustTargetPackageValidationOptions {
  rootVersion: string
  targetPackages: readonly Pick<ReferenceRustTargetPackage, 'name' | 'version'>[]
}

interface ShouldBuildLinuxReferenceRustTargetWithDaggerOptions {
  forceBuild: boolean
  publishedOnNpm: boolean
  requiredTargets: readonly VirtualNativeTarget[]
  targetPackage: Pick<ReferenceRustTargetPackage, 'hasLocalBinary' | 'name'> | undefined
}

interface FindMissingRequiredReferenceRustTargetsOptions {
  artifactTargets: readonly VirtualNativeTarget[]
  cachedTarballTargets: readonly VirtualNativeTarget[]
  locallyBuildableTargets: readonly VirtualNativeTarget[]
  publishedTargets: readonly VirtualNativeTarget[]
  requiredTargets: readonly VirtualNativeTarget[]
}

interface ResolveLocalReferenceRustTargetBuildStrategyOptions {
  hostPlatform?: NodeJS.Platform
  hostTarget?: VirtualNativeTarget | null
  target: VirtualNativeTarget
}

interface EnsureReferenceRustGeneratedPackagesOptions {
  forceBuildNativeTargets?: boolean
  requiredTargets: readonly VirtualNativeTarget[]
}

interface MaterializeReferenceRustTargetTarballsOptions {
  forceBuildNativeTargets?: boolean
  requiredTargets?: readonly VirtualNativeTarget[]
}

function referenceRustArtifactsDir(packageDir: string): string {
  return resolve(packageDir, 'artifacts')
}

function referenceRustNpmDir(packageDir: string): string {
  return resolve(packageDir, 'npm')
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

function hasLocalNativeBinary(targetDir: string): boolean {
  return readdirSync(targetDir, { withFileTypes: true }).some(
    entry => entry.isFile() && entry.name.endsWith('.node')
  )
}

function listReferenceRustTargetPackages(packageDir: string): ReferenceRustTargetPackage[] {
  const npmDir = referenceRustNpmDir(packageDir)
  if (!existsSync(npmDir)) {
    return []
  }

  return readdirSync(npmDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map((entry) => {
      const dir = join(npmDir, entry.name)
      const packageJson = readJson<RustTargetPackageJson>(join(dir, 'package.json'))

      return {
        dir,
        hasLocalBinary: hasLocalNativeBinary(dir),
        name: packageJson.name,
        version: packageJson.version,
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name))
}

function readReferenceRustRootVersion(packageDir: string): string {
  return readJson<RustTargetPackageJson>(join(packageDir, 'package.json')).version
}

async function stageLocalReferenceRustBinaryIntoTargetPackage(
  packageDir: string,
  targetPackages: readonly ReferenceRustTargetPackage[],
): Promise<void> {
  const triple = getVirtualNativeTriple()

  if (!triple) {
    return
  }

  const targetPackageName = getVirtualNativePackageName(triple)
  const targetPackage = targetPackages.find(pkg => pkg.name === targetPackageName)

  if (!targetPackage) {
    return
  }

  const localBinaryPath = resolve(packageDir, 'native', `virtual-native.${triple}.node`)
  if (!existsSync(localBinaryPath)) {
    return
  }

  await copyFile(localBinaryPath, resolve(targetPackage.dir, `virtual-native.${triple}.node`))
}

async function removeReferenceRustTargetPackageBinaries(
  targetPackages: readonly ReferenceRustTargetPackage[],
  requiredTargets: readonly VirtualNativeTarget[],
): Promise<void> {
  const requiredTargetPackageNames = new Set<string>(
    requiredTargets.map((target) => getVirtualNativePackageName(target)),
  )

  for (const targetPackage of targetPackages) {
    if (!requiredTargetPackageNames.has(targetPackage.name)) {
      continue
    }

    for (const entry of readdirSync(targetPackage.dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.node')) {
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

async function buildLinuxReferenceRustBinaryWithDagger(packageDir: string): Promise<void> {
  const triple: VirtualNativeTarget = 'linux-x64-gnu'
  const rustTarget = getRustTarget(triple)
  const outputPathInContainer = `/workspace/packages/reference-rs/virtual-native.${triple}.node`
  const outputPathOnHost = resolve(packageDir, `virtual-native.${triple}.node`)

  const runBuild = async () => {
    const pnpmStore = dag.cacheVolume('reference-ui-rust-linux-pnpm-store')
    const cargoHome = dag.cacheVolume('reference-ui-rust-linux-cargo-home')
    const rustupHome = dag.cacheVolume('reference-ui-rust-linux-rustup-home')
    const cargoTarget = dag.cacheVolume('reference-ui-rust-linux-cargo-target')

    const container = dag
      .container({ platform: 'linux/amd64' as Platform })
      .from('node:24-bookworm')
      .withDirectory('/workspace', repoSource())
      .withMountedCache('/pnpm/store', pnpmStore)
      .withMountedCache('/root/.cargo', cargoHome)
      .withMountedCache('/root/.rustup', rustupHome)
      .withMountedCache('/workspace/packages/reference-rs/target', cargoTarget)
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
      .withExec(['corepack', 'prepare', 'pnpm@10.29.3', '--activate'])
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
        `export PATH=/root/.cargo/bin:$PATH && pnpm --filter @reference-ui/rust exec napi build --platform --release --target ${rustTarget}`,
      ])

    await container.file(outputPathInContainer).export(outputPathOnHost)
  }

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
}

export function shouldBuildLinuxReferenceRustTargetWithDagger(
  options: ShouldBuildLinuxReferenceRustTargetWithDaggerOptions,
): boolean {
  if (!options.requiredTargets.includes('linux-x64-gnu')) {
    return false
  }

  if (!options.targetPackage) {
    return false
  }

  if (options.targetPackage.name !== getVirtualNativePackageName('linux-x64-gnu')) {
    return false
  }

  if (!options.forceBuild && options.targetPackage.hasLocalBinary) {
    return false
  }

  return true
}

export function resolveLocalReferenceRustTargetBuildStrategy(
  options: ResolveLocalReferenceRustTargetBuildStrategyOptions,
): LocalReferenceRustTargetBuildStrategy {
  const hostPlatform = options.hostPlatform ?? process.platform
  const hostTarget = options.hostTarget ?? getVirtualNativeTriple(hostPlatform, process.arch)

  if (hostTarget && options.target === hostTarget) {
    return 'reuse-host-binary'
  }

  if (options.target === 'linux-x64-gnu') {
    return 'build-linux-with-dagger'
  }

  if (options.target === 'win32-x64-msvc') {
    return 'build-windows-cross-target'
  }

  if (
    hostPlatform === 'darwin'
    && (options.target === 'darwin-x64' || options.target === 'darwin-arm64')
  ) {
    return 'build-darwin-cross-target'
  }

  return 'unavailable'
}

export function getLocallyBuildableReferenceRustTargets(
  hostTarget: VirtualNativeTarget | null = getVirtualNativeTriple(),
  hostPlatform: NodeJS.Platform = process.platform,
): VirtualNativeTarget[] {
  return SUPPORTED_VIRTUAL_NATIVE_TARGETS.filter(
    (target) => resolveLocalReferenceRustTargetBuildStrategy({
      hostPlatform,
      hostTarget,
      target,
    }) !== 'unavailable',
  )
}

export function findMissingRequiredReferenceRustTargets(
  options: FindMissingRequiredReferenceRustTargetsOptions,
): VirtualNativeTarget[] {
  const availableTargets = new Set<VirtualNativeTarget>([
    ...options.locallyBuildableTargets,
    ...options.artifactTargets,
    ...options.cachedTarballTargets,
    ...options.publishedTargets,
  ])

  return options.requiredTargets.filter((target) => !availableTargets.has(target))
}

function hasDownloadedReferenceRustArtifact(packageDir: string, target: VirtualNativeTarget): boolean {
  return existsSync(
    resolve(packageDir, 'artifacts', `bindings-${getRustTarget(target)}`, `virtual-native.${target}.node`),
  )
}

async function ensureReferenceRustTargetInstalled(target: VirtualNativeTarget): Promise<void> {
  await run('rustup', ['target', 'add', getRustTarget(target)], {
    label: `Install Rust target ${target}`,
  })
}

async function buildReferenceRustBinaryWithNapi(
  packageDir: string,
  target: VirtualNativeTarget,
  crossCompile: boolean = false,
): Promise<void> {
  await ensureReferenceRustTargetInstalled(target)

  const args = ['exec', 'napi', 'build', '--platform', '--release', '--target', getRustTarget(target)]

  if (crossCompile) {
    args.push('--cross-compile')
  }

  await run('pnpm', args, {
    cwd: packageDir,
    label: `${crossCompile ? 'Cross-build' : 'Build'} @reference-ui/rust ${target}`,
  })
}

async function stageBuiltReferenceRustBinaryIntoTargetPackage(
  packageDir: string,
  targetPackage: ReferenceRustTargetPackage,
  target: VirtualNativeTarget,
): Promise<void> {
  await copyFile(
    resolve(packageDir, `virtual-native.${target}.node`),
    resolve(targetPackage.dir, `virtual-native.${target}.node`),
  )
}

export function getMissingLocalReleaseRustTargets(
  packageDir: string,
  requiredTargets: readonly VirtualNativeTarget[] = SUPPORTED_VIRTUAL_NATIVE_TARGETS,
): VirtualNativeTarget[] {
  const locallyBuildableTargets = getLocallyBuildableReferenceRustTargets()
  const artifactTargets = requiredTargets.filter((target) => hasDownloadedReferenceRustArtifact(packageDir, target))

  return findMissingRequiredReferenceRustTargets({
    artifactTargets,
    cachedTarballTargets: [],
    locallyBuildableTargets,
    publishedTargets: [],
    requiredTargets,
  })
}

async function stageRequiredContainerBuiltReferenceRustBinaries(
  packageDir: string,
  targetPackages: readonly ReferenceRustTargetPackage[],
  requiredTargets: readonly VirtualNativeTarget[],
  forceBuild: boolean,
): Promise<void> {
  const targetPackageName = getVirtualNativePackageName('linux-x64-gnu')
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

  await buildLinuxReferenceRustBinaryWithDagger(packageDir)
  await copyFile(
    resolve(packageDir, 'virtual-native.linux-x64-gnu.node'),
    resolve(targetPackage.dir, 'virtual-native.linux-x64-gnu.node'),
  )
}

async function stageRequiredLocallyBuiltReferenceRustBinaries(
  packageDir: string,
  targetPackages: readonly ReferenceRustTargetPackage[],
  requiredTargets: readonly VirtualNativeTarget[],
  forceBuild: boolean,
): Promise<void> {
  const requiredTargetPackageNames = new Set<string>(
    requiredTargets.map((target) => getVirtualNativePackageName(target)),
  )

  for (const targetPackage of targetPackages) {
    if ((!forceBuild && targetPackage.hasLocalBinary) || !requiredTargetPackageNames.has(targetPackage.name)) {
      continue
    }

    const target = SUPPORTED_VIRTUAL_NATIVE_TARGETS.find(
      (candidate) => getVirtualNativePackageName(candidate) === targetPackage.name,
    )

    if (!target) {
      continue
    }

    switch (resolveLocalReferenceRustTargetBuildStrategy({ target })) {
      case 'reuse-host-binary':
      case 'build-darwin-cross-target':
        await buildReferenceRustBinaryWithNapi(packageDir, target)
        await stageBuiltReferenceRustBinaryIntoTargetPackage(packageDir, targetPackage, target)
        break

      case 'build-windows-cross-target':
        await buildReferenceRustBinaryWithNapi(packageDir, target, true)
        await stageBuiltReferenceRustBinaryIntoTargetPackage(packageDir, targetPackage, target)
        break

      case 'build-linux-with-dagger':
      case 'unavailable':
        break
    }
  }
}

export function getReferenceRustTargetPackageValidationErrors(
  options: ReferenceRustTargetPackageValidationOptions,
): string[] {
  const targetPackagesByName = new Map(
    options.targetPackages.map(targetPackage => [targetPackage.name, targetPackage]),
  )

  return SUPPORTED_VIRTUAL_NATIVE_TARGETS.flatMap((triple) => {
    const expectedName = getVirtualNativePackageName(triple)
    const targetPackage = targetPackagesByName.get(expectedName)

    if (!targetPackage) {
      return `Missing generated native package ${expectedName}@${options.rootVersion}.`
    }

    if (targetPackage.version !== options.rootVersion) {
      return `Generated native package ${targetPackage.name}@${targetPackage.version} does not match @reference-ui/rust@${options.rootVersion}.`
    }

    return []
  })
}

export function createReferenceRustPackageJsonOverride(
  targetPackages: readonly Pick<ReferenceRustTargetPackage, 'name' | 'version'>[],
): BuildPackageJsonOverride | undefined {
  if (targetPackages.length === 0) {
    return undefined
  }

  return {
    optionalDependencies: Object.fromEntries(
      targetPackages.map(targetPackage => [targetPackage.name, targetPackage.version]),
    ),
  }
}

export function resolveReferenceRustTargetTarballStrategy(options: {
  allowRemoteFallback: boolean
  hasLocalBinary: boolean
  publishedOnNpm: boolean
  tarballExists: boolean
}): RustTargetTarballStrategy {
  if (options.hasLocalBinary) {
    return 'pack-local-binary'
  }

  if (!options.allowRemoteFallback) {
    return 'skip-target'
  }

  if (options.tarballExists) {
    return 'reuse-cached-tarball'
  }

  if (options.publishedOnNpm) {
    return 'fetch-published-tarball'
  }

  return 'skip-target'
}

function planReferenceRustTargetTarball(
  targetPackage: ReferenceRustTargetPackage,
  allowRemoteFallback: boolean,
): RustTargetTarballPlan {
  const tarballFileName = packedTarballName(targetPackage.name, targetPackage.version)
  const tarballPath = resolve(rustGeneratedTarballsDir, tarballFileName)
  const tarballExists = existsSync(tarballPath)

  return {
    strategy: resolveReferenceRustTargetTarballStrategy({
      allowRemoteFallback,
      hasLocalBinary: targetPackage.hasLocalBinary,
      publishedOnNpm:
        !targetPackage.hasLocalBinary && !tarballExists
          ? isPublishedOnNpm(targetPackage.name, targetPackage.version)
          : false,
      tarballExists,
    }),
    tarballFileName,
    tarballPath,
  }
}

async function executeReferenceRustTargetTarballPlan(
  targetPackage: ReferenceRustTargetPackage,
  plan: RustTargetTarballPlan,
): Promise<boolean> {
  switch (plan.strategy) {
    case 'pack-local-binary':
      await rm(plan.tarballPath, { force: true })
      await run('npm', ['pack', '--pack-destination', rustGeneratedTarballsDir], {
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
      await run('npm', ['pack', `${targetPackage.name}@${targetPackage.version}`, '--pack-destination', rustGeneratedTarballsDir], {
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

async function ensureReferenceRustGeneratedPackages(
  packageDir: string,
  options: EnsureReferenceRustGeneratedPackagesOptions,
): Promise<ReferenceRustTargetPackage[]> {
  const { forceBuildNativeTargets = false, requiredTargets } = options

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
      listReferenceRustTargetPackages(packageDir),
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
  }

  const initialTargetPackages = listReferenceRustTargetPackages(packageDir)
  if (!forceBuildNativeTargets) {
    await stageLocalReferenceRustBinaryIntoTargetPackage(packageDir, initialTargetPackages)
  }
  const targetPackagesAfterHostStaging = listReferenceRustTargetPackages(packageDir)
  await stageRequiredLocallyBuiltReferenceRustBinaries(
    packageDir,
    targetPackagesAfterHostStaging,
    requiredTargets,
    forceBuildNativeTargets,
  )
  const targetPackagesAfterLocalBuilds = listReferenceRustTargetPackages(packageDir)
  await stageRequiredContainerBuiltReferenceRustBinaries(
    packageDir,
    targetPackagesAfterLocalBuilds,
    requiredTargets,
    forceBuildNativeTargets,
  )

  const rootVersion = readReferenceRustRootVersion(packageDir)
  const targetPackages = listReferenceRustTargetPackages(packageDir)
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
): Promise<BuildRegistryArtifactPackage[]> {
  const requiredTargets = options.requiredTargets ?? SUPPORTED_VIRTUAL_NATIVE_TARGETS
  const forceBuildNativeTargets = options.forceBuildNativeTargets ?? false
  const targetPackages = await ensureReferenceRustGeneratedPackages(packageDir, {
    forceBuildNativeTargets,
    requiredTargets,
  })
  const generatedPackages: BuildRegistryArtifactPackage[] = []
  const requiredTargetPackageNames = new Set<string>(
    requiredTargets.map(target => getVirtualNativePackageName(target)),
  )
  const skippedTargets: ReferenceRustTargetPackage[] = []

  await mkdir(rustGeneratedTarballsDir, { recursive: true })

  for (const targetPackage of targetPackages) {
    const plan = planReferenceRustTargetTarball(targetPackage, !forceBuildNativeTargets)

    // Release builds force fresh local binaries; non-release registry staging can reuse remote tarballs.
    if (!(await executeReferenceRustTargetTarballPlan(targetPackage, plan))) {
      if (requiredTargetPackageNames.has(targetPackage.name)) {
        skippedTargets.push(targetPackage)
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

  return generatedPackages
}