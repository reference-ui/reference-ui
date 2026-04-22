import { execFileSync, spawn } from 'node:child_process'
import { constants, openSync } from 'node:fs'
import { access, mkdir, readFile, readdir, rm, unlink, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { computePackageBuildHashes } from '../build/cache.js'
import { logSkip } from '../lib/log/index.js'
import {
  listPublicWorkspacePackages,
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
  version: 1
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
    return JSON.parse(contents) as RegistryManifest
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

function registryAuthTokenOption(registryUrl: string): string {
  const url = new URL(registryUrl)
  const normalizedPath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  return `--//${url.host}${normalizedPath}:_authToken=${localRegistryAuthToken}`
}

export async function packPublicPackages(): Promise<RegistryManifest> {
  const publicPackages = sortPackagesForInternalDependencyOrder(listPublicWorkspacePackages())
  const publicPackageNames = new Set(publicPackages.map((pkg) => pkg.name))
  const publicPackageHashes = computePackageBuildHashes(publicPackages)
  const previousManifest = await readPreviousRegistryManifest()
  const previousManifestByPackage = new Map(
    (previousManifest?.packages ?? []).map((pkg) => [pkg.name, pkg]),
  )

  await mkdir(tarballsDir, { recursive: true })

  const manifestPackages: RegistryManifestPackage[] = []
  const activeTarballPaths = new Set<string>()

  for (const pkg of publicPackages) {
    const packageHash = publicPackageHashes.get(pkg.name)
    if (!packageHash) {
      throw new Error(`Missing registry hash for ${pkg.name}`)
    }

    const tarballFileName = packedTarballName(pkg.name, pkg.version)
    const tarballPath = resolve(tarballsDir, tarballFileName)
    const previousPackage = previousManifestByPackage.get(pkg.name)

    if (!(previousPackage?.hash === packageHash && previousPackage.tarballFileName === tarballFileName)) {
      await rm(tarballPath, { force: true })

      await run('pnpm', ['--filter', pkg.name, 'pack', '--pack-destination', tarballsDir], {
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

  const manifest: RegistryManifest = {
    generatedAt: new Date().toISOString(),
    packages: manifestPackages,
    registry: {
      defaultUrl: defaultRegistryUrl,
      kind: 'npm-compatible',
    },
    version: 1,
  }

  await writeManifest(manifest)

  return manifest
}

export async function readRegistryManifest(): Promise<RegistryManifest> {
  const contents = await readFile(manifestPath, 'utf8')
  return JSON.parse(contents) as RegistryManifest
}

export async function publishPackedTarballs(registryUrl: string = defaultRegistryUrl): Promise<void> {
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
      label: `Publish ${pkg.name}@${pkg.version}`,
    })
  }
}

export async function stagePublicPackages(registryUrl: string = defaultRegistryUrl): Promise<void> {
  await packPublicPackages()
  await publishPackedTarballs(registryUrl)
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