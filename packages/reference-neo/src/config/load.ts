// Loading for Neo ui.config files from a project root.
// It takes a working directory and emits the validated config plus dependencies and load-time warnings.
// This module is a Neo-owned copy of the core loader with no global registry; it also times the evaluation and
// carries the slow-config warning (slow-evaluation.ts) for sync to report.

import { resolve } from 'node:path'
import type { ReferenceUIConfig } from './types.ts'
import { ConfigNotFoundError, LoadConfigError } from './errors.ts'
import { resolveRefConfigFile } from '../lib/paths/index.ts'
import { attemptedDependencyPathsOf, bundleConfigWithDependencies } from './bundle.ts'
import { evaluateConfig, type EvaluateConfigOptions } from './evaluate.ts'
import { validateConfig } from './validate.ts'
import { slowConfigDiagnostic } from './slow-evaluation.ts'
import type { NeoDiagnostic } from '../diagnostics/types.ts'

export interface LoadedUserConfig {
  config: ReferenceUIConfig
  dependencyPaths: string[]
  /** Load-time warnings: BSS-W-SLOW-CONFIG when evaluation ran past the slow threshold. Absent on hand-built loads. */
  diagnostics?: NeoDiagnostic[]
}

// Last successful load per resolved project root: the watch resync path
// rebuilds its trigger scope from the same load the compile consumed,
// never a second load. A failed load never replaces it, so a broken config
// cannot corrupt the scope the watcher keeps.
const lastLoadedByRoot = new Map<string, LoadedUserConfig>()

// Files the last failed load imported or tried to import, per resolved project root. A file the
// config names but that does not exist yet is in no successful load, so the watch takes these
// too: creating one of them is the fix. A successful load clears the record.
const lastAttemptedByRoot = new Map<string, string[]>()

/** The last successfully loaded config for this root, if this process loaded one. */
export function getLastLoadedUserConfig(cwd: string): LoadedUserConfig | undefined {
  return lastLoadedByRoot.get(resolve(cwd))
}

/** The files the last failed load for this root imported or tried to import. Empty when its last load succeeded. */
export function getAttemptedUserConfigDependencies(cwd: string): string[] {
  return lastAttemptedByRoot.get(resolve(cwd)) ?? []
}

/**
 * Load and evaluate the user's ui.config.ts/js file.
 * Uses esbuild bundling to handle TypeScript configs.
 */
export async function loadUserConfig(
  cwd: string = process.cwd()
): Promise<ReferenceUIConfig> {
  return (await loadUserConfigWithDependencies(cwd)).config
}

export async function loadUserConfigWithDependencies(
  cwd: string = process.cwd(),
  options: EvaluateConfigOptions = {}
): Promise<LoadedUserConfig> {
  const configPath = resolveRefConfigFile(cwd)
  if (!configPath) {
    throw new ConfigNotFoundError(cwd)
  }
  const root = resolve(cwd)

  let imported: string[] = []
  let raw: unknown
  let slow: NeoDiagnostic | undefined
  try {
    const bundled = await bundleConfigWithDependencies(configPath)
    imported = bundled.dependencyPaths
    const started = performance.now()
    raw = await evaluateConfig(bundled.code, configPath, options)
    slow = slowConfigDiagnostic({
      configPath,
      durationMs: performance.now() - started,
      externalImports: bundled.externalImports,
    })
  } catch (err) {
    lastAttemptedByRoot.set(root, [...new Set([...imported, ...attemptedDependencyPathsOf(err)])])
    throw new LoadConfigError(configPath, err)
  }

  let config: ReferenceUIConfig
  try {
    config = validateConfig(raw)
  } catch (err) {
    lastAttemptedByRoot.set(root, imported)
    throw err
  }

  const loaded = { config, dependencyPaths: imported, diagnostics: slow === undefined ? [] : [slow] }
  lastLoadedByRoot.set(root, loaded)
  lastAttemptedByRoot.delete(root)
  return loaded
}
