/**
 * Discovery for matrix-enabled workspace packages.
 *
 * The inclusion contract is intentionally tiny: a package participates in the
 * pipeline matrix only when it has a `matrix.json` file inside the top-level
 * `matrix/` directory with a stable logical name and explicit refSync config.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { listWorkspacePackages } from '../../../build/workspace.js'
import type { WorkspacePackage } from '../../../build/types.js'
import { repoRoot } from '../../../build/workspace.js'

export type MatrixRefSyncMode = 'full' | 'watch-ready' | 'watch-full'

const knownMatrixBundlerStrategies = ['vite7', 'webpack5'] as const
export type MatrixBundlerStrategy = typeof knownMatrixBundlerStrategies[number]

const knownMatrixReactRuntimes = ['react19'] as const
export type MatrixReactRuntime = typeof knownMatrixReactRuntimes[number]

export interface MatrixPackageRefSyncConfig {
  mode: MatrixRefSyncMode
}

export interface MatrixPackageConfig {
  name: string
  refSync: MatrixPackageRefSyncConfig
  bundlers: readonly MatrixBundlerStrategy[]
  react: MatrixReactRuntime
  runTypecheck: boolean
}

export interface MatrixPackageDefinition {
  config: MatrixPackageConfig
  configPath: string
  dir: string
  packageName: string
}

export interface MatrixWorkspacePackage {
  config: MatrixPackageConfig
  configPath: string
  workspacePackage: WorkspacePackage
}

const matrixRootDir = resolve(repoRoot, 'matrix')

function parseTrailingMajor(value: string): number {
  const match = value.match(/(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : Number.NEGATIVE_INFINITY
}

function sortByTrailingMajor<T extends string>(values: readonly T[]): T[] {
  return [...values].sort((left, right) => parseTrailingMajor(right) - parseTrailingMajor(left))
}

export function getSupportedMatrixBundlerStrategies(): readonly MatrixBundlerStrategy[] {
  return knownMatrixBundlerStrategies
}

export function getSupportedMatrixReactRuntimes(): readonly MatrixReactRuntime[] {
  return knownMatrixReactRuntimes
}

export function getLatestMatrixBundlerStrategyForPrefix(
  prefix: string,
  candidates: readonly MatrixBundlerStrategy[] = knownMatrixBundlerStrategies,
): MatrixBundlerStrategy | null {
  const matching = candidates.filter(bundler => bundler.startsWith(prefix))
  return sortByTrailingMajor(matching)[0] ?? null
}

export function getPreferredLocalMatrixBundlers(
  candidates: readonly MatrixBundlerStrategy[] = knownMatrixBundlerStrategies,
): readonly MatrixBundlerStrategy[] {
  const latestViteBundler = getLatestMatrixBundlerStrategyForPrefix('vite', candidates)

  if (latestViteBundler) {
    return [latestViteBundler]
  }

  return candidates[0] ? [candidates[0]] : []
}

export function getLatestMatrixReactRuntime(
  candidates: readonly MatrixReactRuntime[] = knownMatrixReactRuntimes,
): MatrixReactRuntime {
  const latest = sortByTrailingMajor(candidates)[0]

  if (!latest) {
    throw new Error('Expected at least one supported matrix React runtime.')
  }

  return latest
}

function isKnownMatrixBundlerStrategy(value: unknown): value is MatrixBundlerStrategy {
  return knownMatrixBundlerStrategies.includes(value as MatrixBundlerStrategy)
}

function isKnownMatrixReactRuntime(value: unknown): value is MatrixReactRuntime {
  return knownMatrixReactRuntimes.includes(value as MatrixReactRuntime)
}

function matrixConfigPath(packageDir: string): string {
  return resolve(packageDir, 'matrix.json')
}

export function getMatrixPackageName(config: Pick<MatrixPackageConfig, 'name'>): string {
  return `@matrix/${config.name}`
}

function normalizeSelectedMatrixPackageName(packageName: string): string {
  return packageName.startsWith('@matrix/') ? packageName : `@matrix/${packageName}`
}

export function isMatrixWorkspacePackageDir(packageDir: string): boolean {
  const relativePath = relative(matrixRootDir, packageDir)

  return relativePath.length > 0 && !relativePath.startsWith('..') && relativePath !== '.'
}

export function readMatrixPackageConfig(packageDir: string): MatrixPackageConfig | null {
  const configPath = matrixConfigPath(packageDir)

  if (!existsSync(configPath)) {
    return null
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    name?: unknown
    refSync?: {
      mode?: unknown
    }
    bundlers?: unknown
    react?: unknown
    runTypecheck?: unknown
  }

  if (typeof config.name !== 'string' || config.name.trim().length === 0) {
    throw new Error(`Expected ${configPath} to declare a non-empty string matrix name.`)
  }

  if (
    config.refSync?.mode !== 'full'
    && config.refSync?.mode !== 'watch-ready'
    && config.refSync?.mode !== 'watch-full'
  ) {
    throw new Error(
      `Expected ${configPath} to declare refSync.mode as "full", "watch-ready", or "watch-full".`,
    )
  }

  if (!Array.isArray(config.bundlers) || config.bundlers.length === 0) {
    throw new Error(`Expected ${configPath} to declare bundlers as a non-empty array.`)
  }

  for (const bundler of config.bundlers) {
    if (!isKnownMatrixBundlerStrategy(bundler)) {
      throw new Error(
        `Expected ${configPath} to declare bundlers as an array of known strategies ("vite7", "webpack5"). Got: ${String(bundler)}`,
      )
    }
  }

  if (!isKnownMatrixReactRuntime(config.react)) {
    throw new Error(
      `Expected ${configPath} to declare react as one of ${knownMatrixReactRuntimes.map(runtime => `"${runtime}"`).join(', ')}.`,
    )
  }

  if (config.runTypecheck !== undefined && typeof config.runTypecheck !== 'boolean') {
    throw new Error(`Expected ${configPath} to declare runTypecheck as a boolean when provided.`)
  }

  return {
    name: config.name,
    refSync: {
      mode: config.refSync.mode,
    },
    bundlers: config.bundlers as MatrixBundlerStrategy[],
    react: config.react,
    runTypecheck: config.runTypecheck ?? false,
  }
}

export function listMatrixPackageDefinitions(packageNames?: readonly string[]): MatrixPackageDefinition[] {
  const selectedNames = packageNames ? new Set(packageNames.map(normalizeSelectedMatrixPackageName)) : null

  const collectDefinitions = (dir: string): MatrixPackageDefinition | null => {
    const config = readMatrixPackageConfig(dir)

    if (!config) {
      return null
    }

    return {
      config,
      configPath: matrixConfigPath(dir),
      dir,
      packageName: getMatrixPackageName(config),
    }
  }

  const definitions = readdirSync(matrixRootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap((entry) => {
      const dir = resolve(matrixRootDir, entry.name)
      const definition = collectDefinitions(dir)

      if (definition) {
        return [definition]
      }

      // No matrix.json at this level — treat the directory as a group container
      // and scan one level deeper (e.g. matrix/chain/T1, matrix/chain/T2).
      return readdirSync(dir, { withFileTypes: true })
        .filter(subEntry => subEntry.isDirectory())
        .map(subEntry => collectDefinitions(resolve(dir, subEntry.name)))
        .filter((d): d is MatrixPackageDefinition => d !== null)
    })
    .filter(definition => selectedNames ? selectedNames.has(definition.packageName) : true)
    .sort((left, right) => left.packageName.localeCompare(right.packageName))

  if (selectedNames) {
    const discoveredNames = new Set(definitions.map(definition => definition.packageName))
    const missingNames = [...selectedNames].filter(packageName => !discoveredNames.has(packageName)).sort((a, b) => a.localeCompare(b))

    if (missingNames.length > 0) {
      throw new Error(`Unknown matrix package selection: ${missingNames.join(', ')}`)
    }
  }

  return definitions
}

export function listMatrixWorkspacePackages(packageNames?: readonly string[]): MatrixWorkspacePackage[] {
  const workspacePackagesByDir = new Map(
    listWorkspacePackages().map(workspacePackage => [workspacePackage.dir, workspacePackage] as const),
  )

  return listMatrixPackageDefinitions(packageNames)
    .map((definition) => {
      const workspacePackage = workspacePackagesByDir.get(definition.dir)

      if (!workspacePackage) {
        throw new Error(
          `Matrix package ${definition.packageName} is missing package.json. Run \`pnpm pipeline setup --packages=${definition.packageName}\` first.`,
        )
      }

      return {
        config: definition.config,
        configPath: definition.configPath,
        workspacePackage,
      }
    })
    .sort((left, right) => left.workspacePackage.name.localeCompare(right.workspacePackage.name))
}