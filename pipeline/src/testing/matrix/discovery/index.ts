/**
 * Discovery for matrix-enabled workspace packages.
 *
 * The inclusion contract is intentionally tiny: a package participates in the
 * pipeline matrix only when it has a `matrix.json` file with `matrix: true` and
 * a stable logical name used by pipeline-managed scripts and filtering.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { listWorkspacePackages } from '../../../build/workspace.js'
import type { WorkspacePackage } from '../../../build/types.js'
import { repoRoot } from '../../../build/workspace.js'

export type MatrixRefSyncMode = 'full' | 'watch-ready'

export interface MatrixPackageRefSyncConfig {
  mode: MatrixRefSyncMode
}

export interface MatrixPackageConfig {
  matrix: true
  name: string
  refSync: MatrixPackageRefSyncConfig
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
    matrix?: unknown
    name?: unknown
    refSync?: {
      mode?: unknown
    }
    runTypecheck?: unknown
  }

  if (config.matrix !== true) {
    return null
  }

  if (typeof config.name !== 'string' || config.name.trim().length === 0) {
    throw new Error(`Expected ${configPath} to declare a non-empty string matrix name.`)
  }

  if (config.refSync?.mode !== 'full' && config.refSync?.mode !== 'watch-ready') {
    throw new Error(
      `Expected ${configPath} to declare refSync.mode as "full" or "watch-ready".`,
    )
  }

  if (config.runTypecheck !== undefined && typeof config.runTypecheck !== 'boolean') {
    throw new Error(`Expected ${configPath} to declare runTypecheck as a boolean when provided.`)
  }

  return {
    matrix: true,
    name: config.name,
    refSync: {
      mode: config.refSync.mode,
    },
    runTypecheck: config.runTypecheck ?? false,
  }
}

export function listMatrixPackageDefinitions(packageNames?: readonly string[]): MatrixPackageDefinition[] {
  const selectedNames = packageNames ? new Set(packageNames.map(normalizeSelectedMatrixPackageName)) : null

  const definitions = readdirSync(matrixRootDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map((entry) => {
      const dir = resolve(matrixRootDir, entry.name)
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
    })
    .filter((definition): definition is MatrixPackageDefinition => definition !== null)
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