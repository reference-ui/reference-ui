/**
 * Discovery for matrix-enabled workspace packages.
 *
 * The inclusion contract is intentionally tiny: a package participates in the
 * pipeline matrix only when it has a `matrix.json` file with `matrix: true`.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { listWorkspacePackages } from '../../build/workspace.js'
import type { WorkspacePackage } from '../../build/types.js'

export interface MatrixPackageConfig {
  matrix: true
}

export interface MatrixWorkspacePackage {
  config: MatrixPackageConfig
  configPath: string
  workspacePackage: WorkspacePackage
}

function matrixConfigPath(packageDir: string): string {
  return resolve(packageDir, 'matrix.json')
}

export function readMatrixPackageConfig(packageDir: string): MatrixPackageConfig | null {
  const configPath = matrixConfigPath(packageDir)

  if (!existsSync(configPath)) {
    return null
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8')) as { matrix?: unknown }
  if (config.matrix !== true) {
    return null
  }

  return {
    matrix: true,
  }
}

export function listMatrixWorkspacePackages(): MatrixWorkspacePackage[] {
  return listWorkspacePackages()
    .flatMap((workspacePackage) => {
      const config = readMatrixPackageConfig(workspacePackage.dir)
      if (!config) {
        return []
      }

      return [{
        config,
        configPath: matrixConfigPath(workspacePackage.dir),
        workspacePackage,
      }]
    })
    .sort((left, right) => left.workspacePackage.name.localeCompare(right.workspacePackage.name))
}