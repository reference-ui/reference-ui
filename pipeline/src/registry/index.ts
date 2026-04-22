import { execFileSync, spawn } from 'node:child_process'
import { constants, openSync } from 'node:fs'
import { access, cp, mkdir, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computePackageBuildHashes } from '../build/cache.js'
import { logSkip } from '../lib/log/index.js'
import {
  listRegistryWorkspacePackages,
  listWorkspacePackages,
  pipelineStateDir,
  repoRoot,
  run,
  sortPackagesForInternalDependencyOrder,
  type WorkspacePackage,
} from '../build/workspace.js'

export const defaultRegistryUrl = 'http://127.0.0.1:4873'

const registryStateDir = resolve(pipelineStateDir, 'registry')
const tarballsDir = resolve(registryStateDir, 'tarballs')
const manifestPath = resolve(registryStateDir, 'manifest.json')
const rewriteDir = resolve(registryStateDir, 'rewrite')
const stagingDir = resolve(registryStateDir, 'staging')
const registryDir = dirname(fileURLToPath(import.meta.url))
const verdaccioRootDir = resolve(registryDir, 'verdaccio')
const verdaccioStoreDir = resolve(registryDir, '.store')
const verdaccioConfigPath = resolve(verdaccioRootDir, 'config.yaml')
const verdaccioStorageDir = resolve(verdaccioStoreDir, 'storage')
const verdaccioPidPath = resolve(registryStateDir, 'verdaccio.pid')
const verdaccioLogPath = resolve(registryStateDir, 'verdaccio.log')
const localRegistryAuthToken = 'reference-ui-local'

function packedTarballName(name: string, version: string): string {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}

interface RegistryManifestPackage {
  hash: string
  internalDependencies: string[]
  name: string
  sourceDir: string
  tarballFileName: string
  tarballPath: string
  version: string
}

interface RegistryManifest {
  generatedAt: string
  packages: RegistryManifestPackage[]
  registry: {
    defaultUrl: string
    kind: 'npm-compatible'
  }
  version: 2
}

interface PackageJsonLike {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  private?: boolean
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds)
  })
}

async function isRegistryAvailable(registryUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${registryUrl}/-/ping`, {
      signal: AbortSignal.timeout(1_000),
    })

    return response.ok
  } catch {
    return false
  }
}

async function waitForRegistry(registryUrl: string, timeoutMs: number = 15_000): Promise<void> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isRegistryAvailable(registryUrl)) {
      return
    }

    await sleep(250)
  }

  throw new Error(`Timed out waiting for local registry at ${registryUrl}`)
}

async function readManagedRegistryPid(): Promise<number | null> {
  try {
    const contents = await readFile(verdaccioPidPath, 'utf8')
    const pid = Number.parseInt(contents.trim(), 10)
    return Number.isFinite(pid) ? pid : null
  } catch {
    return null
  }
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function removeManagedRegistryPidFile(): Promise<void> {
  try {
    await unlink(verdaccioPidPath)
  } catch {
    // Ignore missing pid files.
  }
}

export async function stopManagedLocalRegistry(): Promise<void> {
  const pid = await readManagedRegistryPid()

  if (!pid) {
    return
  }

  if (!isProcessRunning(pid)) {
    await removeManagedRegistryPidFile()
    return
  }

  process.kill(pid, 'SIGTERM')

  const startedAt = Date.now()
  while (Date.now() - startedAt < 5_000) {
    if (!isProcessRunning(pid)) {
      await removeManagedRegistryPidFile()
      return
    }

    await sleep(100)
  }

  process.kill(pid, 'SIGKILL')
  await removeManagedRegistryPidFile()
}

async function startManagedLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  await mkdir(registryStateDir, { recursive: true })

  const logFd = openSync(verdaccioLogPath, 'a')
  const child = spawn(
    'pnpm',
    [
      'exec',
      'verdaccio',
      '--config',
      verdaccioConfigPath,
      '--listen',
      '127.0.0.1:4873',
    ],
    {
      cwd: resolve(repoRoot, 'pipeline'),
      detached: true,
      stdio: ['ignore', logFd, logFd],
    },
  )

  child.unref()

  if (!child.pid) {
    throw new Error('Failed to start the managed local registry process.')
  }

  await writeFile(verdaccioPidPath, `${child.pid}\n`)
  await waitForRegistry(registryUrl)
}

export async function ensureManagedLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  if (registryUrl !== defaultRegistryUrl) {
    throw new Error(`Managed registry startup only supports ${defaultRegistryUrl} right now.`)
  }

  const registryAlreadyRunning = await isRegistryAvailable(registryUrl)
  const managedPid = await readManagedRegistryPid()
  const managedRegistryRunning = managedPid !== null && isProcessRunning(managedPid)

  if (registryAlreadyRunning && !managedRegistryRunning) {
    throw new Error(
      `A registry is already running at ${registryUrl}, but it is not managed by the pipeline. Stop that process or use the lower-level registry commands manually.`,
    )
  }

  if (managedPid !== null && !managedRegistryRunning) {
    await removeManagedRegistryPidFile()
  }

  if (registryAlreadyRunning || managedRegistryRunning) {
    return
  }

  await startManagedLocalRegistry(registryUrl)
}

export async function rebuildManagedLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  if (registryUrl !== defaultRegistryUrl) {
    throw new Error(`Managed registry rebuild only supports ${defaultRegistryUrl} right now.`)
  }

  const registryAlreadyRunning = await isRegistryAvailable(registryUrl)
  const managedPid = await readManagedRegistryPid()
  const managedRegistryRunning = managedPid !== null && isProcessRunning(managedPid)

  if (registryAlreadyRunning && !managedRegistryRunning) {
    throw new Error(
      `A registry is already running at ${registryUrl}, but it is not managed by the pipeline. Stop that process or use the lower-level registry commands manually.`,
    )
  }

  await stopManagedLocalRegistry()
  await rm(verdaccioStorageDir, { force: true, recursive: true })
  await startManagedLocalRegistry(registryUrl)
}

export async function cleanManagedLocalRegistry(): Promise<void> {
  await stopManagedLocalRegistry()
  await rm(registryStateDir, { force: true, recursive: true })
  await rm(verdaccioStoreDir, { force: true, recursive: true })
}

function packageInternalDependencies(
  pkg: WorkspacePackage,
  packageNames: ReadonlySet<string>,
): string[] {
  return Object.keys(pkg.dependencies)
    .filter((dependencyName) => packageNames.has(dependencyName))
    .sort((a, b) => a.localeCompare(b))
}

function isPublishedToRegistry(name: string, version: string, registryUrl: string): boolean {
  try {
    const output = execFileSync('npm', ['view', `${name}@${version}`, 'version', '--registry', registryUrl, '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    return output.length > 0
  } catch {
    return false
  }
}

async function writeManifest(manifest: RegistryManifest): Promise<void> {
  await mkdir(registryStateDir, { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function readPreviousRegistryManifest(): Promise<RegistryManifest | null> {
  try {
    const contents = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(contents) as { version?: number }

    if (manifest.version !== 2) {
      return null
    }

    return manifest as RegistryManifest
  } catch {
    return null
  }
}

async function pruneStaleTarballs(activeTarballPaths: ReadonlySet<string>): Promise<void> {
  try {
    const tarballEntries = await readdir(tarballsDir, { withFileTypes: true })

    for (const entry of tarballEntries) {
      if (!entry.isFile()) {
        continue
      }

      const absolutePath = resolve(tarballsDir, entry.name)
      if (activeTarballPaths.has(absolutePath)) {
        continue
      }

      await rm(absolutePath, { force: true })
    }
  } catch {
    // Ignore missing directories.
  }
}

async function pruneStalePreparedPackages(activePreparedPackagePaths: ReadonlySet<string>): Promise<void> {
  try {
    const preparedEntries = await readdir(stagingDir, { withFileTypes: true })

    for (const entry of preparedEntries) {
      if (!entry.isDirectory()) {
        continue
      }

      const absolutePath = resolve(stagingDir, entry.name)
      if (activePreparedPackagePaths.has(absolutePath)) {
        continue
      }

      await rm(absolutePath, { force: true, recursive: true })
    }
  } catch {
    // Ignore missing directories.
  }
}

function stagedPackageDirPath(pkg: WorkspacePackage): string {
  return resolve(stagingDir, basename(packedTarballName(pkg.name, pkg.version), '.tgz'))
}

function resolveWorkspaceProtocolVersion(
  packageName: string,
  dependencySpec: string,
  workspacePackageVersions: ReadonlyMap<string, string>,
): string {
  if (!dependencySpec.startsWith('workspace:')) {
    return dependencySpec
  }

  const workspaceVersion = workspacePackageVersions.get(packageName)
  if (!workspaceVersion) {
    throw new Error(`Cannot resolve workspace dependency ${packageName} for local registry packaging.`)
  }

  const workspaceRange = dependencySpec.slice('workspace:'.length)
  if (workspaceRange === '' || workspaceRange === '*') {
    return workspaceVersion
  }

  if (workspaceRange === '^' || workspaceRange === '~') {
    return `${workspaceRange}${workspaceVersion}`
  }

  return workspaceRange
}

function rewriteWorkspaceProtocolDependencies(
  dependencies: Record<string, string> | undefined,
  workspacePackageVersions: ReadonlyMap<string, string>,
): Record<string, string> | undefined {
  if (!dependencies) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([packageName, dependencySpec]) => [
      packageName,
      resolveWorkspaceProtocolVersion(packageName, dependencySpec, workspacePackageVersions),
    ]),
  )
}

async function prepareWorkspacePackageForLocalRegistry(
  pkg: WorkspacePackage,
  workspacePackageVersions: ReadonlyMap<string, string>,
): Promise<string> {
  const preparedPackageDir = stagedPackageDirPath(pkg)
  const preparedPackageJsonPath = resolve(preparedPackageDir, 'package.json')

  await rm(preparedPackageDir, { force: true, recursive: true })
  await mkdir(stagingDir, { recursive: true })

  await cp(pkg.dir, preparedPackageDir, {
    filter: (sourcePath) => {
      const sourceName = basename(sourcePath)
      return sourceName !== '.git' && sourceName !== 'node_modules'
    },
    recursive: true,
  })

  const preparedPackageJson = JSON.parse(
    await readFile(preparedPackageJsonPath, 'utf8'),
  ) as PackageJsonLike

  if (pkg.private) {
    delete preparedPackageJson.private
  }

  preparedPackageJson.dependencies = rewriteWorkspaceProtocolDependencies(
    preparedPackageJson.dependencies,
    workspacePackageVersions,
  )
  preparedPackageJson.devDependencies = rewriteWorkspaceProtocolDependencies(
    preparedPackageJson.devDependencies,
    workspacePackageVersions,
  )
  preparedPackageJson.optionalDependencies = rewriteWorkspaceProtocolDependencies(
    preparedPackageJson.optionalDependencies,
    workspacePackageVersions,
  )
  preparedPackageJson.peerDependencies = rewriteWorkspaceProtocolDependencies(
    preparedPackageJson.peerDependencies,
    workspacePackageVersions,
  )

  await writeFile(preparedPackageJsonPath, `${JSON.stringify(preparedPackageJson, null, 2)}\n`)

  return preparedPackageDir
}

function registryAuthTokenOption(registryUrl: string): string {
  const url = new URL(registryUrl)
  const normalizedPath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  return `--//${url.host}${normalizedPath}:_authToken=${localRegistryAuthToken}`
}

export async function packPublicPackages(): Promise<RegistryManifest> {
  const publicPackages = sortPackagesForInternalDependencyOrder(listRegistryWorkspacePackages())
  const publicPackageNames = new Set(publicPackages.map((pkg) => pkg.name))
  const workspacePackageVersions = new Map(
    listWorkspacePackages().map((workspacePkg) => [workspacePkg.name, workspacePkg.version]),
  )
  const publicPackageHashes = computePackageBuildHashes(publicPackages)
  const previousManifest = await readPreviousRegistryManifest()
  const previousManifestByPackage = new Map(
    (previousManifest?.packages ?? []).map((pkg) => [pkg.name, pkg]),
  )

  await mkdir(tarballsDir, { recursive: true })

  const manifestPackages: RegistryManifestPackage[] = []
  const activeTarballPaths = new Set<string>()
  const activePreparedPackagePaths = new Set<string>()

  for (const pkg of publicPackages) {
    const packageHash = publicPackageHashes.get(pkg.name)
    if (!packageHash) {
      throw new Error(`Missing registry hash for ${pkg.name}`)
    }

    const tarballFileName = packedTarballName(pkg.name, pkg.version)
    const tarballPath = resolve(tarballsDir, tarballFileName)
    const previousPackage = previousManifestByPackage.get(pkg.name)
    const preparedPackageDir = stagedPackageDirPath(pkg)

    if (!(previousPackage?.hash === packageHash && previousPackage.tarballFileName === tarballFileName)) {
      await rm(tarballPath, { force: true })

      await prepareWorkspacePackageForLocalRegistry(pkg, workspacePackageVersions)

      await run('pnpm', ['pack', '--pack-destination', tarballsDir], {
        cwd: preparedPackageDir,
        env: {
          npm_config_ignore_scripts: 'true',
        },
        label: `Pack ${pkg.name}`,
      })
    } else {
      logSkip(`Skipping pack for ${pkg.name}; tarball hash unchanged`)
    }

    await access(tarballPath, constants.F_OK)
    activeTarballPaths.add(tarballPath)
    activePreparedPackagePaths.add(preparedPackageDir)

    manifestPackages.push({
      hash: packageHash,
      internalDependencies: packageInternalDependencies(pkg, publicPackageNames),
      name: pkg.name,
      sourceDir: relative(repoRoot, pkg.dir),
      tarballFileName,
      tarballPath: relative(repoRoot, tarballPath),
      version: pkg.version,
    })
  }

  await pruneStaleTarballs(activeTarballPaths)
  await pruneStalePreparedPackages(activePreparedPackagePaths)

  const manifest: RegistryManifest = {
    generatedAt: new Date().toISOString(),
    packages: manifestPackages,
    registry: {
      defaultUrl: defaultRegistryUrl,
      kind: 'npm-compatible',
    },
    version: 2,
  }

  await writeManifest(manifest)

  return manifest
}

export async function readRegistryManifest(): Promise<RegistryManifest> {
  const contents = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(contents) as { version?: number }

  if (manifest.version !== 2) {
    throw new Error('Registry manifest is out of date. Re-run the registry pack step.')
  }

  return manifest as RegistryManifest
}

export async function loadPackedTarballsIntoLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  const manifest = await readRegistryManifest()
  const authTokenOption = registryAuthTokenOption(registryUrl)

  for (const pkg of manifest.packages) {
    if (isPublishedToRegistry(pkg.name, pkg.version, registryUrl)) {
      logSkip(`Skipping ${pkg.name}@${pkg.version}; already present in ${registryUrl}`)
      continue
    }

    await run('npm', [
      'publish',
      resolve(repoRoot, pkg.tarballPath),
      '--registry',
      registryUrl,
      '--access',
      'public',
      authTokenOption,
    ], {
      label: `Load ${pkg.name}@${pkg.version} into local registry`,
    })
  }
}

export async function stagePublicPackages(registryUrl: string = defaultRegistryUrl): Promise<void> {
  await packPublicPackages()
  await loadPackedTarballsIntoLocalRegistry(registryUrl)
}

export async function rebuildLocalRegistryAndStagePublicPackages(
  registryUrl: string = defaultRegistryUrl,
): Promise<void> {
  await rebuildManagedLocalRegistry(registryUrl)
  await stagePublicPackages(registryUrl)
}

export async function ensureLocalRegistryAndStagePublicPackages(
  registryUrl: string = defaultRegistryUrl,
): Promise<void> {
  await ensureManagedLocalRegistry(registryUrl)
  await stagePublicPackages(registryUrl)
}

export function registryManifestPath(): string {
  return manifestPath
}