/**
 * Filesystem layout and stable constants for the registry subsystem.
 *
 * Keeping the paths in one place makes the rest of the registry code read more
 * like workflow logic and less like stringly typed path plumbing.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipelineStateDir } from '../build/workspace.js'

export const defaultRegistryUrl = 'http://127.0.0.1:4873'
export const localRegistryAuthToken = 'reference-ui-local'

export const registryStateDir = resolve(pipelineStateDir, 'registry')
export const tarballsDir = resolve(registryStateDir, 'tarballs')
export const manifestPath = resolve(registryStateDir, 'manifest.json')
export const loadedStatePath = resolve(registryStateDir, 'loaded-state.json')
export const stagingDir = resolve(registryStateDir, 'staging')

const registryModuleDir = dirname(fileURLToPath(import.meta.url))
export const verdaccioRootDir = resolve(registryModuleDir, 'verdaccio')
export const verdaccioStoreDir = resolve(registryModuleDir, '.store')
export const verdaccioConfigPath = resolve(verdaccioRootDir, 'config.yaml')
export const verdaccioStorageDir = resolve(verdaccioStoreDir, 'storage')
export const verdaccioPidPath = resolve(registryStateDir, 'verdaccio.pid')
export const verdaccioLogPath = resolve(registryStateDir, 'verdaccio.log')

export function packedTarballName(name: string, version: string): string {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}