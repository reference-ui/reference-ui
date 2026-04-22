/**
 * Registry load workflow.
 *
 * Once the pack step has written tarballs plus a manifest, this module handles
 * publishing those tarballs into the managed local Verdaccio registry and
 * provides the higher-level stage helpers used by the build pipeline.
 */

import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { repoRoot, run } from '../build/workspace.js'
import { logSkip } from '../lib/log/index.js'
import { readRegistryManifest } from './manifest.js'
import { defaultRegistryUrl, loadedStatePath, localRegistryAuthToken } from './paths.js'
import { packPublicPackages } from './pack.js'
import { ensureManagedLocalRegistry, rebuildManagedLocalRegistry } from './runtime.js'

interface LoadedRegistryStateEntry {
  hash: string
  loadedAt: string
  version: string
}

type LoadedRegistryState = Record<string, LoadedRegistryStateEntry>

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

function registryAuthTokenOption(registryUrl: string): string {
  const url = new URL(registryUrl)
  const normalizedPath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  return `--//${url.host}${normalizedPath}:_authToken=${localRegistryAuthToken}`
}

async function readLoadedRegistryState(): Promise<LoadedRegistryState> {
  try {
    const contents = await readFile(loadedStatePath, 'utf8')
    return JSON.parse(contents) as LoadedRegistryState
  } catch {
    return {}
  }
}

async function writeLoadedRegistryState(state: LoadedRegistryState): Promise<void> {
  await mkdir(resolve(loadedStatePath, '..'), { recursive: true })
  await writeFile(loadedStatePath, `${JSON.stringify(state, null, 2)}\n`)
}

async function rebuildRegistryIfLoadedHashesChanged(registryUrl: string): Promise<void> {
  const manifest = await readRegistryManifest()
  const loadedState = await readLoadedRegistryState()

  const requiresRebuild = manifest.packages.some((pkg) => {
    const previous = loadedState[pkg.name]

    return previous !== undefined
      && previous.version === pkg.version
      && previous.hash !== pkg.hash
  })

  if (!requiresRebuild) {
    return
  }

  await rebuildManagedLocalRegistry(registryUrl)
}

export async function loadPackedTarballsIntoLocalRegistry(registryUrl: string = defaultRegistryUrl): Promise<void> {
  const manifest = await readRegistryManifest()
  const authTokenOption = registryAuthTokenOption(registryUrl)

  await rebuildRegistryIfLoadedHashesChanged(registryUrl)

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

  await writeLoadedRegistryState(
    Object.fromEntries(
      manifest.packages.map((pkg) => [
        pkg.name,
        {
          hash: pkg.hash,
          loadedAt: new Date().toISOString(),
          version: pkg.version,
        },
      ]),
    ),
  )
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