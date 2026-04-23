/**
 * Manifest persistence for the registry pack/load workflow.
 *
 * The pack step writes a versioned manifest, and the load step refuses to use
 * an out-of-date shape so the local registry flow fails loudly when the pack
 * contract changes.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { manifestPath, registryStateDir } from './paths.js'
import { registryManifestVersion, type RegistryManifest } from './types.js'

export async function writeRegistryManifest(manifest: RegistryManifest): Promise<void> {
  await mkdir(registryStateDir, { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

export async function readPreviousRegistryManifest(): Promise<RegistryManifest | null> {
  try {
    const contents = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(contents) as { version?: number }

    if (manifest.version !== registryManifestVersion) {
      return null
    }

    return manifest as RegistryManifest
  } catch {
    return null
  }
}

export async function readRegistryManifest(): Promise<RegistryManifest> {
  const contents = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(contents) as { version?: number }

  if (manifest.version !== registryManifestVersion) {
    throw new Error('Registry manifest is out of date. Re-run the registry pack step.')
  }

  return manifest as RegistryManifest
}